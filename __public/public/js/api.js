async function testApi()
{
    const Bhidden = document.getElementById("hidden")

    // Api call 
    let base = "/v2/anime?page=1&limit=8"
    const req = await fetch(base)
    const items = await req.json()

    // Api Res 
    const res = () => items.data.map(item =>
    {
        const html = `
            <div class="max-w-sm bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700">
            <img class="rounded-t-lg" src="${item.images.webp.image_url}" alt=".." width="350" height="350"/>
<div class="p-5">
    <a href="#">
        <h5 class="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">${item.title}</h5>
    </a>
    <a href="https://mfanimelist.vercel.app/anime/${item.mal_id}" target="_Blank" class="inline-flex items-center text-white bg-blue-700 hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 font-medium rounded-full text-sm px-5 py-2.5 text-center me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">
        MfAnimeList
    </a>
</div>
</div>
        `
        document.getElementById('res').innerHTML += html;
    })
    res()

    if (res)
    {
        Bhidden.style.display = "none"
    }
}
