"use client";

/**
 * Export Dashboard to PDF utility
 * Uses html2canvas + jsPDF
 * 
 * Usage:
 *   import { exportDashboardToPDF } from "@/lib/export-pdf";
 *   await exportDashboardToPDF("dashboard-content", "CuuNet-ThongKe-2026");
 */

export async function exportDashboardToPDF(
    elementId: string,
    filename: string = "CuuNet-Dashboard"
): Promise<boolean> {
    try {
        // Dynamic import to avoid SSR issues
        const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
            import("html2canvas"),
            import("jspdf"),
        ]);

        const element = document.getElementById(elementId);
        if (!element) {
            console.warn("[ExportPDF] Element not found:", elementId);
            return false;
        }

        // Show loading toast
        const toast = document.createElement("div");
        toast.className = "fixed top-4 right-4 z-[9999] px-4 py-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-sm font-medium shadow-lg flex items-center gap-2";
        toast.innerHTML = '<span class="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></span> Đang xuất PDF...';
        document.body.appendChild(toast);

        // Capture element as canvas
        const canvas = await html2canvas(element, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: "#F8FAFC",
            logging: false,
        });

        // Calculate PDF dimensions (A4 landscape)
        const imgWidth = 297; // A4 landscape width in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        const pageHeight = 210; // A4 landscape height in mm

        // Create PDF
        const pdf = new jsPDF({
            orientation: "landscape",
            unit: "mm",
            format: "a4",
        });

        // Add pages if content is taller than one page
        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        while (heightLeft > 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
        }

        // Add metadata
        pdf.setProperties({
            title: filename,
            subject: "CứuNet - Thống kê thiên tai",
            author: "CứuNet Platform",
            creator: "CứuNet Export System",
        });

        // Save
        const date = new Date().toISOString().split("T")[0];
        pdf.save(`${filename}-${date}.pdf`);

        // Remove loading toast
        document.body.removeChild(toast);

        // Show success toast
        const successToast = document.createElement("div");
        successToast.className = "fixed top-4 right-4 z-[9999] px-4 py-3 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm font-medium shadow-lg flex items-center gap-2";
        successToast.innerHTML = '✅ Đã xuất PDF thành công!';
        document.body.appendChild(successToast);
        setTimeout(() => document.body.removeChild(successToast), 3000);

        return true;
    } catch (err) {
        console.error("[ExportPDF] Error:", err);
        return false;
    }
}

/**
 * Export data to CSV
 */
export function exportToCSV(data: Record<string, unknown>[], filename: string): void {
    if (data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csvRows = [
        headers.join(","),
        ...data.map((row) =>
            headers
                .map((h) => {
                    const val = row[h];
                    const str = String(val ?? "");
                    return str.includes(",") || str.includes('"')
                        ? `"${str.replace(/"/g, '""')}"`
                        : str;
                })
                .join(",")
        ),
    ];

    const csvContent = csvRows.join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}-${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}