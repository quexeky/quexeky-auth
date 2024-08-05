export async function worker_fetch(path: string, body: string, binding: Fetcher, accepts: string = "application/json") {
    const fetched_data = await binding.fetch(`http://localhost:8787/${path}`, {
        method: "POST",
        body: body,
        headers: {
            "Content-Type": "application/json",
            "Accept": accepts
        }
    });

    {
        //console.log("Fetched Data", new TextDecoder().decode((await fetched_data.body.getReader().read()).value));
    }

    //console.log("Fetched data Values:", fetched_data.body.values());
    const text = await fetched_data.text();

    console.log("Fetched Data:", fetched_data);

    if (fetched_data.bodyUsed) {
        //return JSON.parse(text);
    }

    return {text: text, status: fetched_data.status};
}