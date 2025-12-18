import { getServerUrl } from "@/utils/get-server-url";
import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const payload = await request.json();
        const headers = request.headers;

        const { data, status } = await axios.post(
            getServerUrl(`auth/register`),
            payload,
            {
                headers: {
                    Authorization: headers.get("Authorization") ?? "",
                },
            }
        );

        return NextResponse.json(data, { status: status || 200 });
    } catch (err: any) {
        console.error("Register error:", err);

        return NextResponse.json(
            {
                message:
                    err.response?.data?.message ||
                    err.message ||
                    "Server Error",
            },
            { status: err.response?.status || 500 }
        );
    }
}