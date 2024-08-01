export async function worker_fetch(path: string, body: string, binding: Fetcher) {
    const fetched_data = await binding.fetch(`http://localhost:8787/${path}`, {
        method: "POST", body: body, headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
        }
    });

    console.log(fetched_data.body.values());

    return JSON.parse(new TextDecoder().decode((await fetched_data.body.getReader().read()).value));
}