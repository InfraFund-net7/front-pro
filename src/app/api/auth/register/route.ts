import { getServerUrl } from "@/utils/get-server-url";
import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const payload = await request.json();
        const headers = request.headers;

        const { data, status } = await axios.post(
            getServerUrl("auth/register"),
            payload,
            {
                headers: {
                    Authorization: headers.get("Authorization") ?? "",
                },
            }
        );

        return NextResponse.json(data, { status: status || 200 });
    } catch (error: unknown) {
        console.error("Register error:", error);

        if (axios.isAxiosError(error)) {
            return NextResponse.json(
                {
                    message:
                        error.response?.data?.message ||
                        error.message ||
                        "Request failed",
                },
                { status: error.response?.status || 500 }
            );
        }

        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}
