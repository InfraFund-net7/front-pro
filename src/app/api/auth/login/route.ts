import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { verifyMessage } from "ethers";

const LoginSchema = z.object({
    wallet_address: z
        .string()
        .startsWith("0x", "Invalid wallet address format")
        .length(42, "Invalid wallet address length"),
    signature: z
        .string()
        .startsWith("0x", "Invalid signature format")
        .min(130, "Invalid signature"),
    message: z.string().min(1, "Invalid message"),
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const parsed = LoginSchema.parse(body);

        const { wallet_address, signature, message } = parsed;

        let recoveredAddress: string;

        try {
            recoveredAddress = verifyMessage(message, signature);
        } catch (error) {
            console.error("Failed to verify signature:", error);
            return NextResponse.json(
                { error: "Invalid signature — unable to recover wallet address." },
                { status: 401 }
            );
        }

        if (recoveredAddress.toLowerCase() !== wallet_address.toLowerCase()) {
            console.warn(
                `Address mismatch — recovered: ${recoveredAddress}, expected: ${wallet_address}`
            );
            return NextResponse.json(
                { error: "Wallet address does not match the provided signature." },
                { status: 401 }
            );
        }

        return NextResponse.json(
            {
                success: true,
                message: "Authentication successful.",
            },
            { status: 200 }
        );
    } catch (error: unknown) {
        if (error instanceof ZodError) {
            const errors = error.issues.map((e) => ({
                path: e.path.join("."),
                message: e.message,
            }));

            return NextResponse.json(
                {
                    error: "Invalid input data",
                    details: errors,
                },
                { status: 400 }
            );
        }

        console.error("Login route error:", error);

        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
