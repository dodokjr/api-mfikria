const lk21api = require('../../config/lk21api')
const JSDOM = require('jsdom');


const getIndexMovie = async () =>
{
    const indexMoviePage = await lk21api("/index-movie");
    const htmlCode = indexMoviePage.data;

    const { window } = new JSDOM(htmlCode);

    const indexMovie = [
        ...window.document.querySelectorAll(`ul.pagination .cat-item a`),
    ];

    return indexMovie.map((category) => category.textContent);
};

module.export = getIndexMovie