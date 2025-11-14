import { getServerUrl } from "@/utils/get-server-url";
import axios from "axios";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const RegisterSchema = z.object({
    role: z.string().optional(),
    type: z.string().optional(),
    wallet_address: z.string().min(1),
    signature: z.string().min(1),
    message: z.string().min(1),
    confirm_tos: z.boolean().optional(),
    first_name: z.string().optional(),
    last_name: z.string().optional(),
    phone_number: z.string().optional(),
    email: z.string().email().optional(),
    contact_fullname: z.string().optional(),
    company_name: z.string().optional(),
});

export async function POST(request: NextRequest) {
    try {
        const payload = await request.json();
        const headers = request.headers;

        const parsed = RegisterSchema.parse(payload);

        const { data } = await axios.post(
            getServerUrl(`auth/register`),
            parsed,
            {
                headers: {
                    Authorization: headers.get("Authorization") ?? "",
                },
            }
        );

        return NextResponse.json(data);
    } catch (err: any) {
        if (err?.name === "ZodError") {
            return NextResponse.json({ message: err.errors }, { status: 400 });
        }

        console.error("Register error:", err);

        return NextResponse.json(
            { message: err.response?.data?.message || err.message || "Server Error" },
            { status: err.response?.status || 500 }
        );
    }
}
