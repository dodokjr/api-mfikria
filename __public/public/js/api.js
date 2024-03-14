
async function testApi()
{
    const Bhidden = document.getElementById("hidden")
    const Loading = document.getElementById("loading")
    const Derror = document.getElementById("error")
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
    <a href="https://123.lk21official.mom/${item._id}" target="_blank">
        <h5 class="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">${item.title}</h5>
    </a>
</div>
</div>
        `
        document.getElementById("res").innerHTML += html;
    })
    res()

    if (res) Bhidden.style.display = "none"
}


async function Contributors()
{
    const Base = "/contributors"
    const data = await fetch(Base)
    const item = await data.json()

    const res = () => item.data.map(items =>
    {
        const html = `
        <div role="listitem" class="relative flex justify-center items-center">
                <a href="/op?mediaS=github&name=${items.name}" target="_blank">
                  <div class="relative h-40 bg-white hover:drop-shadow-2xl w-48 flex justify-center rounded-md">
                    <img src="./public/svgs/github.svg" class="absolute top-16 h-6 w-6" alt="github.img" />
                    <img src="${items.img_src}" class="absolute w-20 h-20 -top-8 rounded-full" alt="display avatar" role="img" title="dodokj" />
                    <p class="absolute top-24 text-center text-black">@${items.name}</p>
                  </div>
                </a>
                </div>
        `
        document.getElementById("ress").innerHTML += html;
    })
    res()
}
Contributors()