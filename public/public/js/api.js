async function fetchText()
{
    let response = await fetch('https://api-mfikria.vercel.app/status');

    console.log(response.status); // 200

    if (response.status === 200)
    {
        let data = await response.text();
        // handle data
    }
}


fetchText();