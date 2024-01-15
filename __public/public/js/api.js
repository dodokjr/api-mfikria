async function getCard()
{
    const queryUrl = `/v2/anime`
    const response = await fetch(queryUrl);
    const CardResponse = await response.json();
    return CardResponse;
}