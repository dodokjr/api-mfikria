
async function fetchText()
{
    let response = await fetch('/servers?&key=ecUAYQg2yvKSkQ8&service=11AQF5FOI0OLAPm4tWsR7h_OINi1ZxW0zAToA5KsOgRspAciFJnKjWwCbAUU3PCTZmHUIU7ZUYekplA90N&status=OK20011AQF5FOI0xOVsQZENZpGR_saJdhOqMNrXyIhA2c68d6CJwjYUQwFRTbnNXtxfNRaKXTLXPYAE5xihUThv');
    document.getElementById("root").innerText = `Server Service ${response.status} ${response.statusText}`

}

fetchText()
