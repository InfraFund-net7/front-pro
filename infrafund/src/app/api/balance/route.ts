import { NextRequest, NextResponse } from "next/server";
import backend from "@/utils/server-axios";
import { getServerUrl } from "@/utils/get-server-url";

export async function GET(request: NextRequest) {
    const bearerToken = request.headers.get("Authorization");
    return await backend
        .get(getServerUrl("wallet/balance"), {
            headers: {
                Authorization: bearerToken,
            },
        })
        .then(({ data }) => {
            return NextResponse.json(data);
        })
        .catch(({ response: { data, status } }) => {
            return NextResponse.json(data, { status: status });
        });
}
