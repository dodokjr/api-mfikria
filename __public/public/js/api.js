async function testApi()
{
    const Bhidden = document.getElementById("hidden")

    // Api call 
    let base = "/lk21/movies"
    const req = await fetch(base)
    const items = await req.json()

    // Api Res 
    const res = () => items.map(item =>
    {
        const html = `
            <div class="max-w-sm bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700">
            <img class="rounded-t-lg" src="${item.posterImg}" alt=".." width="350" height="350"/>
<div class="p-5">
    <a href="#">
        <h5 class="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">${item.title}</h5>
    </a>
</div>
</div>
        `
        document.getElementById('res').innerHTML += html;
    })
    res()

    if (res) return Bhidden.style.display = "none"
    if (!res) return innerHTML = "<div>Loading</div>"
}

