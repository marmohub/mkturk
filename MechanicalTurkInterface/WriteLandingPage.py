<!doctype html>

<head>
<script>
// https://stackoverflow.com/questions/17309199/how-to-send-variables-from-one-file-to-another-in-javascript

// https://stackoverflow.com/questions/5411538/redirect-from-an-html-page



function saveData() {

   //creates a base-64 encoded ASCII string
   data = btoa(__EXPERIMENT_FILE_URL_STRING_INSERTS_HERE__);
   //save the encoded accout to web storage
   localStorage.setItem('HIT_Experiment_url', data);
}

saveData()
window.location.href = 'mkturk.html'

</script>
</head>

<body>
Loading HIT...
</body>
</html>