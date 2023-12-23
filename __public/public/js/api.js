
async function fetchText()
{
    let response = await fetch('/status');
    alert(`status website ${response.status}`)

}
fetchText();