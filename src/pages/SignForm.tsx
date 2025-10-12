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
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
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

    if (form.form_type === "brokerage_order" && (!phone || !address)) {
      toast({
        title: "שגיאה",
        description: "נא למלא טלפון וכתובת",
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

    pdf.setFont("helvetica");
    
    if (form.form_type === "brokerage_order") {
      // Header
      pdf.setFontSize(18);
      pdf.text("City Market", 105, 20, { align: "center" });
      pdf.setFontSize(12);
      pdf.text("Real estate agency 1711", 105, 28, { align: "center" });
      pdf.text("www.ctmarket.co.il | 077-9309400", 105, 35, { align: "center" });
      
      let y = 50;
      pdf.setFontSize(10);
      
      // Terms in Hebrew (right-to-left)
      pdf.text("I hereby confirm that the properties listed below were not previously known to me", 20, y);
      y += 5;
      pdf.text("from any other source, and I was referred to them by City Market.", 20, y);
      y += 10;
      
      // Client signature section
      pdf.setFontSize(12);
      pdf.text("Client Signature", 20, y);
      y += 10;
      
      // Property details table
      pdf.setFontSize(10);
      pdf.text("Address", 20, y);
      pdf.text("Floor", 80, y);
      pdf.text("Price No.", 120, y);
      y += 7;
      
      if (form.form_data) {
        pdf.text(form.form_data.property_address || "", 20, y);
        pdf.text(form.form_data.floor || "", 80, y);
        pdf.text(form.form_data.price || "", 120, y);
      }
      y += 10;
      
      // Transaction type
      pdf.text(`For: ${form.form_data?.transaction_type === 'rental' ? 'Rental' : 'Purchase'}`, 20, y);
      y += 10;
      
      // Brokerage fees terms
      pdf.setFontSize(9);
      pdf.text("I hereby undertake to pay you for brokerage as follows:", 20, y);
      y += 7;
      
      if (form.form_data?.transaction_type === 'rental') {
        pdf.text("For rental of apartment/office: 100% of monthly rent + VAT in cash", 25, y);
      } else {
        pdf.text("For purchase or sale: 2% of the total value + VAT in cash", 25, y);
      }
      y += 6;
      pdf.text("D.M.P: 5% of key money including the part to be transferred to the landlord, in cash", 25, y);
      y += 10;
      
      // Additional terms
      pdf.text("This undertaking is valid and binding even if I am assisted by a third party.", 20, y);
      y += 6;
      pdf.text("I undertake to pay the above amount immediately upon signing the agreement.", 20, y);
      y += 10;
      
      // Client details
      pdf.setFontSize(10);
      pdf.text("Client Details:", 20, y);
      y += 7;
      pdf.text(`Name: ${name}`, 25, y);
      y += 6;
      pdf.text(`ID: ${idNumber}`, 25, y);
      y += 6;
      pdf.text(`Phone: ${phone}`, 25, y);
      y += 6;
      pdf.text(`Address: ${address}`, 25, y);
      y += 15;
      
      // Signature
      pdf.text("Signature:", 20, y);
      const signatureData = canvas.toDataURL("image/png");
      y += 5;
      pdf.addImage(signatureData, "PNG", 20, y, 80, 40);
    } else {
      // Memorandum PDF (זכרון דברים)
      pdf.setR2L(true);
      pdf.setFontSize(16);
      pdf.text("זכרון דברים", 105, 20, { align: "center" });

      pdf.setFontSize(11);
      let y = 40;
      const lineHeight = 8;

      // Main content
      pdf.text(`אני החתום מטה ${name} ת.ז ${idNumber}`, 20, y);
      y += lineHeight;
      pdf.text(`מאשר בזאת כי ברצוני לשכור את הדירה ברחוב`, 20, y);
      y += lineHeight;
      
      if (form.form_data.property_address) {
        pdf.text(`${form.form_data.property_address}`, 20, y);
        y += lineHeight;
      }
      
      pdf.text(`אשר הוצגה ע"י סיטי מרקט נכסים`, 20, y);
      y += lineHeight;
      pdf.text(`בתאריך ${signatureDate}`, 20, y);
      y += lineHeight * 2;

      // Terms
      pdf.setFontSize(10);
      pdf.text("ליידוע כי בחתימתי על זיכרון דברים זה אני מתחייב לשכור את הדירה", 20, y);
      y += lineHeight;
      pdf.text("לפי התנאים לעיל ולהלן", 20, y);
      y += lineHeight * 2;

      // Property details
      pdf.setFontSize(11);
      pdf.text("פרטים נוספים:", 20, y);
      y += lineHeight;

      if (form.form_data.rental_price) {
        pdf.text(`מחיר השכירות: ${form.form_data.rental_price}`, 25, y);
        y += lineHeight;
      }

      if (form.form_data.guarantees) {
        pdf.text(`ערבויות: ${form.form_data.guarantees}`, 25, y);
        y += lineHeight;
      }

      if (form.form_data.entry_date) {
        pdf.text(`תאריך כניסה: ${form.form_data.entry_date}`, 25, y);
        y += lineHeight;
      }

      if (form.form_data.payment_method) {
        pdf.text(`צורת תשלום: ${form.form_data.payment_method}`, 25, y);
        y += lineHeight;
      }

      if (form.form_data.misc) {
        pdf.text(`שונות: ${form.form_data.misc}`, 25, y);
        y += lineHeight * 2;
      }

      y += lineHeight;
      pdf.text(`השוכר: ${name}`, 20, y);
      y += lineHeight * 2;

      // Signature
      const signatureData = canvas.toDataURL("image/png");
      pdf.text("חתימה:", 20, y);
      y += 5;
      pdf.addImage(signatureData, "PNG", 20, y, 60, 30);
    }

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
            {form.form_type === "brokerage_order" 
              ? "הזמנת שירותי תיווך - City Market"
              : "זכרון דברים"
            }
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
                placeholder="9 ספרות"
              />
            </div>

            {form.form_type === "brokerage_order" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="phone">טלפון *</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="050-1234567"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">כתובת *</Label>
                  <Input
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="רחוב, עיר"
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label>תאריך</Label>
              <Input value={signatureDate} disabled />
            </div>

            {form.form_data && (
              <>
                {form.form_type === "brokerage_order" ? (
                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-2">פרטי הנכס</h3>
                    
                    {form.form_data.property_address && (
                      <div className="space-y-2">
                        <Label>כתובת הנכס</Label>
                        <Input value={form.form_data.property_address} disabled />
                      </div>
                    )}
                    
                    {form.form_data.floor && (
                      <div className="space-y-2">
                        <Label>קומה</Label>
                        <Input value={form.form_data.floor} disabled />
                      </div>
                    )}
                    
                    {form.form_data.price && (
                      <div className="space-y-2">
                        <Label>מחיר</Label>
                        <Input value={form.form_data.price} disabled />
                      </div>
                    )}
                    
                    {form.form_data.transaction_type && (
                      <div className="space-y-2">
                        <Label>סוג עסקה</Label>
                        <Input value={form.form_data.transaction_type === 'rental' ? 'שכירות' : 'מכירה/קנייה'} disabled />
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    {form.form_data.property_address && (
                      <div className="space-y-2">
                        <Label>כתובת הנכס</Label>
                        <Input value={form.form_data.property_address} disabled />
                      </div>
                    )}
                    
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
              disabled={submitting || !name || !idNumber || (form.form_type === "brokerage_order" && (!phone || !address))}
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
