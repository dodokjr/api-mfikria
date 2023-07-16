async function fetchText()
{
    let response = await fetch('http://localhost:5000/status');

    console.log(response.status); // 200

    if (response.status === 200)
    {
        let data = await response.text();
        // handle data
    }
}


fetchText();