"use client";

import { Dropdown } from "@/components/ui/dropdown";
import { FormInput } from "@/components/ui/form-input";
import { Plus, X } from "lucide-react";
import { useState } from "react";

interface BankTransferData {
  id: string;
  bankAccount: string;
  bankName: string;
  bicSwift: string;
  currency: string;
  ownerName: string;
}

export default function BankTransferForm() {
  const [transfers, setTransfers] = useState<BankTransferData[]>([
    {
      id: "1",
      bankAccount: "",
      bankName: "",
      bicSwift: "",
      currency: "",
      ownerName: "",
    },
  ]);

  const [removingId, setRemovingId] = useState<string | null>(null);

  const addTransfer = () => {
    const newTransfer: BankTransferData = {
      id: Date.now().toString(),
      bankAccount: "",
      bankName: "",
      bicSwift: "",
      currency: "",
      ownerName: "",
    };
    setTransfers([...transfers, newTransfer]);
  };

  const removeTransfer = (id: string) => {
    setRemovingId(id);
    setTimeout(() => {
      setTransfers((prev) => prev.filter((transfer) => transfer.id !== id));
      setRemovingId(null);
    }, 300);
  };

  const updateTransfer = (
    id: string,
    field: keyof BankTransferData,
    value: string
  ) => {
    setTransfers(
      transfers.map((transfer) =>
        transfer.id === id ? { ...transfer, [field]: value } : transfer
      )
    );
  };

  return (
    <div className="w-full space-y-6">
      {transfers.map((transfer, index) => (
        <div
          key={transfer.id}
          className={`w-full rounded-2xl border border-border-card p-6 transform transition-all duration-300 ease-in-out 
          ${removingId === transfer.id ? "animate-fadeOut" : "animate-fadeIn"}`}
          style={{
            animationDelay: `${index * 0.05}s`,
          }}
        >
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-[22px] font-normal text-white">
              Bank Transfer Detail
            </h2>
            <button
              onClick={() => removeTransfer(transfer.id)}
              className="text-gray-400 hover:text-white transition-colors duration-200"
            >
              <X size={24} />
            </button>
          </div>

          <TransferFormSection transfer={transfer} onUpdate={updateTransfer} />
        </div>
      ))}

      <button
        onClick={addTransfer}
        className="flex items-center gap-2 mt-4 text-green-400 hover:text-green-300 transition-colors duration-200 group"
      >
        <div className="w-5 h-5 rounded-full border-2 border-current flex items-center justify-center group-hover:bg-green-400 group-hover:text-gray-900 transition-all duration-200">
          <Plus size={20} />
        </div>
        <span className="font-medium">Add one more</span>
      </button>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes fadeOut {
          from {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          to {
            opacity: 0;
            transform: translateY(10px) scale(0.95);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }

        .animate-fadeOut {
          animation: fadeOut 0.3s ease-in forwards;
        }
      `}</style>
    </div>
  );
}

interface TransferFormSectionProps {
  transfer: BankTransferData;
  onUpdate: (id: string, field: keyof BankTransferData, value: string) => void;
}

function TransferFormSection({ transfer, onUpdate }: TransferFormSectionProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-6">
        <FormInput
          label="Bank account"
          value={transfer.bankAccount}
          placeholder="Bank account"
          onChange={(e) => onUpdate(transfer.id, "bankAccount", e.target.value)}
        />

        <FormInput
          label="Back's name"
          value={transfer.bankName}
          placeholder="Back's name"
          onChange={(e) => onUpdate(transfer.id, "bankName", e.target.value)}
        />

        <FormInput
          label="BIC/SWIFT"
          value={transfer.bicSwift}
          placeholder="BIC/SWIFT"
          onChange={(e) => onUpdate(transfer.id, "bicSwift", e.target.value)}
        />
      </div>

      <div className="space-y-6">
        <Dropdown
          label="Currency"
          value={transfer.currency}
          onChange={(value) => onUpdate(transfer.id, "currency", value)}
          options={[
            { value: "", label: "Currency", key: "" },
            { value: "USD", label: "USD", key: "USD" },
            { value: "IRR", label: "IRR", key: "IRR" },
          ]}
        />

        <FormInput
          label="Owner's name"
          value={transfer.ownerName}
          placeholder="Owner's name"
          onChange={(e) => onUpdate(transfer.id, "ownerName", e.target.value)}
        />
      </div>
    </div>
  );
}
