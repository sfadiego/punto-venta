import { useState } from "react";
import QRCode from "qrcode";
import { logUnexpectedError } from "@/plugins/logger.plugin";

export const useQrDownload = (menuUrl: string | null, businessName: string) => {
    const [isGenerating, setIsGenerating] = useState(false);

    const downloadQr = async () => {
        if (!menuUrl || isGenerating) return;
        setIsGenerating(true);
        try {
            const canvas = document.createElement("canvas");
            const size = 512;
            const padding = 40;
            const qrSize = size - padding * 2;

            await QRCode.toCanvas(canvas, menuUrl, {
                width: qrSize,
                margin: 1,
                color: { dark: "#1c1917", light: "#ffffff" },
            });

            const output = document.createElement("canvas");
            output.width = size;
            output.height = size + 60;
            const ctx = output.getContext("2d")!;

            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, output.width, output.height);

            ctx.drawImage(canvas, padding, padding);

            ctx.fillStyle = "#1c1917";
            ctx.font = "bold 18px sans-serif";
            ctx.textAlign = "center";
            ctx.fillText(businessName, size / 2, size + 30);

            ctx.fillStyle = "#78716c";
            ctx.font = "13px sans-serif";
            ctx.fillText("Escanea para ver el menú", size / 2, size + 52);

            const link = document.createElement("a");
            link.download = `qr-menu-${businessName.toLowerCase().replace(/\s+/g, "-")}.png`;
            link.href = output.toDataURL("image/png");
            link.click();
        } catch (error) {
            logUnexpectedError(error, "useQrDownload.downloadQr");
        } finally {
            setIsGenerating(false);
        }
    };

    return { downloadQr, isGenerating };
};
