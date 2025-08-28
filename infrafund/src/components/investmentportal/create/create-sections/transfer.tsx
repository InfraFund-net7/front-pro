"use client";
import { TabSelect } from "@/components/ui/tab-select";
import React, { useState } from "react";
import TransferBank from "./transfer/transfer-bank";
import TransferCrypto from "./transfer/transfer-crypto";

export default function Transfer() {
  const createsection = [
    { title: "Bank", component: TransferBank },
    { title: "Crypto", component: TransferCrypto },
  ];

  const [selected, setSelected] = useState("Bank");

  const activeSection = createsection.find(
    (section) => section.title === selected
  );
  return (
    <div className="flex flex-col gap-6 w-full">
      <TabSelect
        items={createsection.map((s) => s.title)}
        selectedItem={selected}
        onSelect={setSelected}
      />
      {activeSection ? <activeSection.component /> : "No section found"}
    </div>
  );
}
