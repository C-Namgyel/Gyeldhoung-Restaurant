const domain = "gyeldhoung.com";
// function api(path, domain) {
//   return `http://localhost:8080${path}`;
// }
function api(path) {
  return `https://api.${domain}${path}`;
}
function showLoading(text) {
    loadingOverlay.classList.add("show");
    loadingText.textContent = text;
}
function hideLoading() {
    loadingOverlay.classList.remove("show");
}
function showSnackbar(text, duration = 1500) {
    snackbar.textContent = text;
    snackbar.classList.add("show");

    setTimeout(() => {
        snackbar.classList.remove("show");
    }, duration);
}
function setScreen(id, mode) {
  document.querySelectorAll('.scrn').forEach(scrn => scrn.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}
function getScreen() {
  const active = document.querySelector('.scrn.active');
  return active ? active.id : null;
}
function fetchGet(endpoint, callback) {
  fetch(api(endpoint), {
    headers: {
      'key': 'gyeldhoung'
    }
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      callback({success: true, data: data.data});
    } else {
      callback({success: false, error: data.error});
    }
  })
  .catch(error => callback({success: false, error: error}))
}
function fetchPost(endpoint, payload, callback) {
  fetch(api(endpoint), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'key': 'gyeldhoung'
    },
    body: JSON.stringify(payload)
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      callback({success: true});
    } else {
      callback({success: false, error: data.error});
    }
  })
}
function fetchPut(endpoint, id, payload, callback) {
  fetch(api(endpoint+"/"+id), {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'key': 'gyeldhoung'
    },
    body: JSON.stringify(payload)
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      callback({success: true});
    } else {
      callback({success: false, error: data.error});
    }
  })
}
function fetchDelete(endpoint, id, callback) {
  fetch(api(endpoint+"/"+id), {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json'
    }
  })
  .then(response => response.json())
  .then(data => callback(data.success))
}