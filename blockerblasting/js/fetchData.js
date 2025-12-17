var newDomain = "https://inlogic.cdn.msnfun.com";
// var fetchDataURL = "https://inlogic.cdn.start.gg/9n8tv164mxzf/v36/provideData.html";
// var fetchDataURL = "https://inlogic.cdn.start.gg/9n8tv164mxzf/v35/provideData.html"
// https://inlogic.cdn.msnfun.com/9n8tv164mxzf/v33/index.html
var fetchDataURL = window.origin.replace("msnfun.com","start.gg")  + window.location.pathname.replace("index","provideData");
var openPromiseResolves = {};
var nextId = 0;


// Configurable variables
var alwaysOverwriteKeys = ["_secure__ls__metadata"];
var excludeKeys = ["_pubcid", "_pubcid_exp"];

// Expose functions immediately to window
window.fetchAllLocalStorageKeys = function () {
  nextId++;
  if (window.iFrame && window.iFrame.contentWindow) {
    window.iFrame.contentWindow.postMessage({ request: "fetchAllLocalStorageKeys", id: nextId }, fetchDataURL);
  }
  return new Promise(function (resolve) {
    openPromiseResolves[nextId] = resolve;
  });
};

window.fetchCookie = function (key) {
  nextId++;
  if (window.iFrame && window.iFrame.contentWindow) {
    window.iFrame.contentWindow.postMessage({ request: "fetchCookie", key: key, id: nextId }, fetchDataURL);
  }
  return new Promise(function (resolve) {
    openPromiseResolves[nextId] = resolve;
  });
};

window.fetchLocalStorage = function (key) {
  nextId++;
  if (window.iFrame && window.iFrame.contentWindow) {
    window.iFrame.contentWindow.postMessage({ request: "fetchLocalStorage", key: key, id: nextId }, fetchDataURL);
  }
  return new Promise(function (resolve) {
    openPromiseResolves[nextId] = resolve;
  });
};

// Setup message listener
window.setUpMigrationEvents = function () {
  window.addEventListener("message", function (eMsg) {
    var resolve = openPromiseResolves[eMsg.data.id];
    if (resolve) {
      resolve(eMsg.data);
      delete openPromiseResolves[eMsg.data.id];
    }
  });
};

// Migrate data
window.migrateData = function () {
  if (window.origin !== newDomain) {
    return;
  }

  window.fetchAllLocalStorageKeys().then(function (response) {
    if (!response.keys || response.keys.length === 0) {
      console.warn("⚠ No localStorage keys found in old domain.");
      onMigrationSuccessfull()
      return;
    }

    // Collect all the promises for migrations
    const migrationPromises = response.keys.map(function (key) {
      if (excludeKeys.indexOf(key) !== -1) {
        return Promise.resolve(); // Skip excluded keys
      }

      if (alwaysOverwriteKeys.indexOf(key) !== -1 || !localStorage.getItem(key)) {
        // Migrate only if key does not exist in the new domain or should always be overwritten
        return window.fetchLocalStorage(key).then(function (valueResponse) {
          if (valueResponse.value !== null) {
            localStorage.setItem(key, valueResponse.value);
          } else {
            console.warn("⚠ No data found for key: " + key + ", skipping.");
          }
        });
      }
      return Promise.resolve(); // No migration needed
    });

    // Wait for all migration promises to complete
    Promise.all(migrationPromises).then(function () {
      onMigrationSuccessfull(); // Call the success function after all migrations are done
    }).catch(function (error) {
      console.warn("Error during localStorage migration:", error);
    });

  }).catch(function (error) {
    console.warn("Error during localStorage migration:", error);
  });
};
// Setup iframe and migration process
window.setUpMigration = function (callbackFunction) {
  if (window.origin !== newDomain) {
    return false;
  }

  try {
    var iFrame = document.createElement("iframe");
    iFrame.onerror = function () {
      console.warn("⚠ Failed to load iframe from old domain:", fetchDataURL);
    };
    iFrame.src = fetchDataURL + "?" + Date.now();
    iFrame.style.display = "none";
    document.body.appendChild(iFrame);



    iFrame.addEventListener("load", function () {
      window.iFrame = iFrame;
      window.setUpMigrationEvents();
      if (typeof callbackFunction === "function") {
        callbackFunction();
      }
    });
  } catch (error) {
    console.warn("Error setting up methods or migrating data:", error);
  }
};
//added
document.addEventListener("DOMContentLoaded", function () {
  let initPhaser = false
  if(initPhaser == false){
    phaserInit()
  }
});

function onMigrationSuccessfull() {
  phaserInit()
}
