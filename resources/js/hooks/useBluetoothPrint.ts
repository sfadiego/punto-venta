import { useContext } from "react";
import { BluetoothPrintContext } from "@/contexts/BluetoothPrintContext";

export const useBluetoothPrint = () => useContext(BluetoothPrintContext);
