import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Download, Check } from "lucide-react";
import { jsPDF } from "jspdf";

export default function SignForm() {
  const { token } = useParams();
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<any>(null);
  const [name, setName] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [signatureDate] = useState(new Date().toLocaleDateString('he-IL'));
  const [isSigned, setIsSigned] = useState(false);

  useEffect(() => {
    loadForm();
  }, [token]);

  const loadForm = async () => {
    try {
      const { data, error } = await supabase
        .from("signature_forms")
        .select("*")
        .eq("token", token)
        .single();

      if (error) throw error;

      if (data.status === "signed") {
        setIsSigned(true);
      }

      setForm(data);
    } catch (error: any) {
      console.error("Error loading form:", error);
      toast({
        title: "שגיאה",
        description: "לא ניתן לטעון את הטופס",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const generatePDF = async () => {
    if (!form || !name || !idNumber) {
      toast({
        title: "שגיאה",
        description: "נא למלא את כל השדות",
        variant: "destructive",
      });
      return null;
    }

    const canvas = canvasRef.current;
    if (!canvas) return null;

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    // Add Hebrew font support
    pdf.setFont("helvetica");
    pdf.setR2L(true);

    // Title
    pdf.setFontSize(20);
    pdf.text("זיכרון דברים", 105, 20, { align: "center" });

    // Content
    pdf.setFontSize(12);
    let y = 40;
    const lineHeight = 10;

    pdf.text(`שם: ${name}`, 20, y);
    y += lineHeight;
    pdf.text(`ת.ז: ${idNumber}`, 20, y);
    y += lineHeight;
    pdf.text(`תאריך: ${signatureDate}`, 20, y);
    y += lineHeight * 2;

    if (form.form_data.property_address) {
      pdf.text(`כתובת הנכס: ${form.form_data.property_address}`, 20, y);
      y += lineHeight;
    }

    if (form.form_data.rental_price) {
      pdf.text(`דמי שכירות חודשי: ${form.form_data.rental_price}`, 20, y);
      y += lineHeight;
    }

    if (form.form_data.guarantees) {
      pdf.text(`ערבויות: ${form.form_data.guarantees}`, 20, y);
      y += lineHeight;
    }

    if (form.form_data.entry_date) {
      pdf.text(`תאריך כניסה: ${form.form_data.entry_date}`, 20, y);
      y += lineHeight;
    }

    if (form.form_data.payment_method) {
      pdf.text(`אמצעי תשלום: ${form.form_data.payment_method}`, 20, y);
      y += lineHeight;
    }

    if (form.form_data.misc) {
      pdf.text(`שונות: ${form.form_data.misc}`, 20, y);
      y += lineHeight * 2;
    }

    // Add signature
    y += lineHeight;
    const signatureData = canvas.toDataURL("image/png");
    pdf.text("חתימה:", 20, y);
    y += 5;
    pdf.addImage(signatureData, "PNG", 20, y, 60, 30);

    return pdf;
  };

  const handleSubmit = async () => {
    setSubmitting(true);

    try {
      const pdf = await generatePDF();
      if (!pdf) {
        setSubmitting(false);
        return;
      }

      const canvas = canvasRef.current;
      if (!canvas) throw new Error("Canvas not found");

      const signatureData = canvas.toDataURL("image/png");

      // Update form in database
      const { error: updateError } = await supabase
        .from("signature_forms")
        .update({
          signature_data: signatureData,
          signed_by_name: name,
          signed_by_id_number: idNumber,
          signed_at: new Date().toISOString(),
          status: "signed",
        })
        .eq("token", token);

      if (updateError) throw updateError;

      toast({
        title: "הטופס נחתם בהצלחה!",
        description: "ניתן להוריד את הטופס החתום",
      });

      setIsSigned(true);
    } catch (error: any) {
      console.error("Error submitting form:", error);
      toast({
        title: "שגיאה",
        description: error.message || "אירעה שגיאה בחתימת הטופס",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownload = async () => {
    const pdf = await generatePDF();
    if (!pdf) return;

    pdf.save(`זיכרון_דברים_${name}_${new Date().toLocaleDateString('he-IL')}.pdf`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!form) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card>
          <CardHeader>
            <CardTitle>טופס לא נמצא</CardTitle>
            <CardDescription>הקישור אינו תקף או פג תוקפו</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (isSigned) {
    return (
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Check className="h-6 w-6 text-green-600" />
              <CardTitle>הטופס נחתם בהצלחה</CardTitle>
            </div>
            <CardDescription>
              ניתן להוריד את הטופס החתום
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleDownload} className="gap-2">
              <Download className="h-4 w-4" />
              הורדת הטופס החתום
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <CardTitle>
            {form.form_type === "memorandum" ? "זיכרון דברים" : "טופס צפייה בנכס"}
          </CardTitle>
          <CardDescription>
            אנא מלא את הפרטים וחתום בתחתית הטופס
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">שם מלא *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="הזן שם מלא"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="idNumber">תעודת זהות *</Label>
              <Input
                id="idNumber"
                value={idNumber}
                onChange={(e) => setIdNumber(e.target.value)}
                placeholder="הזן מספר תעודת זהות"
              />
            </div>

            <div className="space-y-2">
              <Label>תאריך</Label>
              <Input value={signatureDate} disabled />
            </div>

            {form.form_data.property_address && (
              <div className="space-y-2">
                <Label>כתובת הנכס</Label>
                <Input value={form.form_data.property_address} disabled />
              </div>
            )}

            {form.form_type === "memorandum" && (
              <>
                {form.form_data.rental_price && (
                  <div className="space-y-2">
                    <Label>דמי שכירות חודשי</Label>
                    <Input value={form.form_data.rental_price} disabled />
                  </div>
                )}
                {form.form_data.guarantees && (
                  <div className="space-y-2">
                    <Label>ערבויות</Label>
                    <Input value={form.form_data.guarantees} disabled />
                  </div>
                )}
                {form.form_data.entry_date && (
                  <div className="space-y-2">
                    <Label>תאריך כניסה</Label>
                    <Input value={form.form_data.entry_date} disabled />
                  </div>
                )}
                {form.form_data.payment_method && (
                  <div className="space-y-2">
                    <Label>אמצעי תשלום</Label>
                    <Input value={form.form_data.payment_method} disabled />
                  </div>
                )}
                {form.form_data.misc && (
                  <div className="space-y-2">
                    <Label>שונות</Label>
                    <Input value={form.form_data.misc} disabled />
                  </div>
                )}
              </>
            )}
          </div>

          <div className="space-y-2">
            <Label>חתימה דיגיטלית *</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
              <canvas
                ref={canvasRef}
                width={600}
                height={200}
                className="border border-gray-300 rounded w-full cursor-crosshair bg-white"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
              <Button
                variant="outline"
                onClick={clearSignature}
                className="mt-2"
                type="button"
              >
                נקה חתימה
              </Button>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleSubmit}
              disabled={submitting || !name || !idNumber}
              className="flex-1"
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              חתום ושלח
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
