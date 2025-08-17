import { getServerUrl } from "@/utils/get-server-url";
import backend from "@/utils/server-axios";
import { NextRequest, NextResponse } from "next/server";


export async function POST(request: NextRequest) {
    const payload = await request.json();
    return await backend
        .post(getServerUrl("wallet/deposit"), payload)
        .then(({ data }) => {
            return NextResponse.json(data);
        })
        .catch(({ response: { data, status } }) => {
            return NextResponse.json(data, { status: status });
        });
}