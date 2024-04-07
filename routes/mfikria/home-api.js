const express = require('express');
const router = express.Router();
router.get("/", function (res, req)
{
    req.status(200).json({
        "status": req.statusCode,
        "message": "Selamat datang di api-mfikria.vercel.app/v1/mfikria",
    })
});
router.get("/home", async (res, req) =>
{
    const api = await fetch("https://api-mfikria.vercel.app/link")
    const ms = await api.json()

    req.status(200).json({
        status: req.statusCode,
        data: {
            title: "MfikriA || Portofolio",
            name: "Muhammad Fikri Ardiyansah",
            img_src: "https://i.pinimg.com/564x/d7/86/63/d78663d102ad37f45f0b6efa721aace3.jpg",
            about: "Saya Suka Sekali Tentang Bahasa Pemograman,  Bahasa Pemograman Yang Saya sukai adalah",
            code: "Html, Javascript, Css, Python, C++, Java, Typescript",
            code_card: [
                {
                    id: "01",
                    title: "Html",
                    img_src: "http://localhost:5000/public/assets/code/html.png",
                    progress: 100,
                    project_code_progress: 100,
                },
                {
                    id: "02",
                    title: "Javascript",
                    img_src: "http://localhost:5000/public/assets/code/js.png",
                    progress: 80,
                    project_code_progress: 95,
                },
                {
                    id: "03",
                    title: "CSS",
                    img_src: "http://localhost:5000/public/assets/code/css.png",
                    progress: 100,
                    project_code_progress: 100,
                },
                {
                    id: "04",
                    title: "React Javascript",
                    img_src: "http://localhost:5000/public/assets/code/react.png",
                    progress: 85,
                    project_code_progress: 80,
                },
                {
                    id: "05",
                    title: "Python",
                    img_src: "http://localhost:5000/public/assets/code/py.png",
                    progress: 40,
                    project_code_progress: 10,
                }
            ],
            project: [
                {
                    "id": "1",
                    "slug": "dodok-store",
                    "title": "Dodok Store",
                    "img_url": "https://api-mfikria.vercel.app/public/assets/project/DodokStore.webp",
                    "descriptions": "Store Project with Html Css Javascript",
                    "url_github": "https://github.com/dodokjr/dodok-store",
                    "url_demo": "https://dodokvapestore.netlify.app/",
                    code: {
                        name_html: "html", skillHtml: 20,
                        name_css: "css", skillCss: 20,
                        name_js: "Javascript", skillJs: 10
                    }
                },
                {
                    "id": "2",
                    "slug": "token-and-password-random",
                    "title": "Token And Password Random",
                    "img_url": "https://api-mfikria.vercel.app/public/assets/project/gabut.webp",
                    "descriptions": "Project with Html Css Javascript",
                    "url_github": "https://github.com/dodokjr/gabut-1",
                    "url_demo": "https://gabut-1.vercel.app/",
                    code: {
                        name_html: "html", skillHtml: 20,
                        name_css: "css", skillCss: 20,
                        name_js: "Javascript", skillJs: 10
                    }
                },
                {
                    "id": "3",
                    "slug": "anime-list",
                    "title": "Anime List",
                    "img_url": "https://api-mfikria.vercel.app/public/assets/project/mfanimelist.webp",
                    "descriptions": "Project with frontend Reactjs and backend Expressjs api with jikan anime",
                    "url_github": "https://github.com/dodokjr/animeList",
                    "url_demo": "https://mfanimelist.vercel.app/",
                    code: {
                        name_html: "html", skillHtml: 20,
                        name_css: "css", skillCss: 20,
                        name_js: "Javascript", skillJs: 10
                    }
                },
                {
                    "id": "4",
                    "slug": "api-mfikria",
                    "title": "official Api By me",
                    "img_url": "https://api-mfikria.vercel.app/public/assets/project/api.webp",
                    "descriptions": "Project with Backend Express js",
                    "url_github": "https://github.com/dodokjr/api-mfikria",
                    "url_demo": "https://api-mfikria.vercel.app/",
                    code: {
                        name_html: "html", skillHtml: 20,
                        name_css: "css", skillCss: 20,
                        name_js: "Javascript", skillJs: 10
                    }
                }
            ],
            blog: [
                {
                    id: "01",
                    title: "Man must explore, and this is exploration at its greatest",
                    descriptions: "Problems look mighty small from 150 miles up, Never in all their history have men been able truly to conceive of the world as one: a single sphere, a globe, having the qualities of a globe, a round earth in which all the directions eventually meet, in which there is no center because every point, or none, is center — an equal earth which all men occupy as equals. The airman's earth, if free men make it, will be truly round: a globe in practice, not in theory....",
                    slug: "post_1",
                    type: "Article",
                    postBy: {
                        title: "Posted by",
                        name: "Admin",
                        img_src: "https://w7.pngwing.com/pngs/178/595/png-transparent-user-profile-computer-icons-login-user-avatars-thumbnail.png",
                        time: "on March 30, 2024"
                    }
                }
            ],
            media_sosial: ms
        }
    })
})

router.get("/blog/post/:id", async (res, req) =>
{
    const id = res.params.id
    const api = await fetch(`http://localhost:5000/mfikria/c/blog/post/${id}`)
    const { data } = await api.json()
    if (!data) return null
    req.status(200).json({
        status: req.statusCode,
        id: id,
        data: data
    })
})

module.exports = router