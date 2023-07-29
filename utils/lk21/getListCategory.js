const lk21api = require('../../config/lk21api')
const JSDOM = require('jsdom');

const getListCategory = async (categoryName) =>
{
    const homePage = await lk21api("/");
    const htmlCode = homePage.data;

    const { window } = new JSDOM(htmlCode);
    const categories = [
        ...window.document.querySelectorAll(
            `ul.navbar-nav .dropdown-menu a[href*="${categoryName}"]`
        ),
    ];

    return categories.map((category) => category.textContent);
};

module.export = getListCategory;
