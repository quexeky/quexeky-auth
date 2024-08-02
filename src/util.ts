export async function worker_fetch(path: string, body: string, binding: Fetcher) {
    const fetched_data = await binding.fetch(`http://localhost:8787/${path}`, {
        method: "POST", body: body, headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
        }
    });

    //console.log("Fetched data Values:", fetched_data.body.values());
    const text = new TextDecoder().decode((await fetched_data.body.getReader().read()).value);
    console.log(text);

    return JSON.parse(text);
}