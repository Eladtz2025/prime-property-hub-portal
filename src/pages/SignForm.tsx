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
      // ===== הזמנת שירותי תיווך =====
      
      // Header
      pdf.setFontSize(24);
      pdf.text("City Market", 105, 15, { align: "center" });
      pdf.setFontSize(12);
      pdf.text("Real estate agency 1711", 105, 22, { align: "center" });
      pdf.setFontSize(10);
      pdf.text("www.ctmarket.co.il | 077-9309400", 105, 27, { align: "center" });
      
      let y = 40;
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "normal");
      
      // Legal content in Hebrew - Full text from PDF
      const hebrewLines = [
        "הנני/אנו מאשר/ים שהנכסים המפורטים להלן אינם ידועים לי/לנו מקודם לכן או/ואינני/אנו",
        "מתחייב/ים לא למסור לזולתי ולא להשתמש בכל מידע הקשור בזה פניה ללא תאום מראש עם \"סיטי מרקט\".",
        "",
        "הנני/אנו מאשר/ים כי פנתי/פנינו לראשונה על ידיכם אל:",
      ];

      hebrewLines.forEach(line => {
        pdf.text(line, 105, y, { align: "center", maxWidth: 180 });
        y += 5;
      });

      // Property details table
      y += 3;
      pdf.setFont("helvetica", "bold");
      const headers = ["כתובת", "קומה", "מס'", "מחיר"];
      const headerX = [25, 80, 120, 160];
      headers.forEach((header, i) => {
        pdf.text(header, headerX[i], y);
      });
      
      y += 6;
      pdf.setFont("helvetica", "normal");
      const propertyData = form.form_data as any;
      pdf.text(propertyData.property_address || "_____________", 25, y);
      pdf.text(propertyData.floor || "___", 80, y);
      pdf.text("___", 120, y);
      pdf.text(propertyData.price || "_____________", 160, y);

      y += 10;
      pdf.setFont("helvetica", "bold");
      pdf.text("עבור " + (propertyData.transaction_type === 'rental' ? 'שכירות' : 'רכישה'), 105, y, { align: "center" });
      
      y += 8;
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      
      const commissionText = [
        "הנני/אנו מתחייב/ים לשלם לכם בגין התווך כדלקמן:",
        "",
      ];
      
      if (propertyData.transaction_type === 'rental') {
        commissionText.push(
          "עם השכרת דירה/משרד    100% מדמי השכירות החודשיים    בתוספת מע\"מ במזומן"
        );
      } else {
        commissionText.push(
          "קניה או מכירה    2% מהערך הכולל של הקניה או המכירה    בתוספת מע\"מ במזומן"
        );
      }
      
      commissionText.push(
        "",
        "ד.מ.פ. בסך של 5% מערך דמי המפתח    כולל החלק שיש להעביר לבעל הבית, במזומן",
        "",
        "התחייבותי זאת תהיה תקפה, שרירה וקיימה במלואה גם אם אעזר בגורם ו/או צד שלישי.",
        "",
        "אני/ו מתחייבים לשלם את הסכום הנ\"ל במזומן מיד עם עשיית ההסכמה (זיכרון דברים)",
        "או/ולכל סיום העסקה בכל מקרה. מיד שאקבל את החזקה בנכס.",
        "",
        "במידה ולא אשלם לכם בתוך 5 ימים מקרות האירוע המזכה אותכם בדמי תיווך - הכל כאמור",
        "לעיל אז יחול עליי חוב של כפל דמי תיווך הנזכרים לעיל והנני מחייב לשלם כפל דמי תיווך",
        "- הכל כאמור לעיל. הכל בתוך 10 ימים מקרות האירוע המזכה אותכם דמי תיווך.",
        "",
        "הנני/ו מאשרים כי ידוע לנ/י כי לא תהיו אחראים בגין כל שינוי מצד האנשים שפנינו אליהם.",
        "ו/או אם הנכס נמכר או/ו אי רצונם להשכיר או/ולמכור את הנכס הנ\"ל ו/או אי רצונם על",
        "ואשכור / אשכיר / אקנה / אמכור. כמו כן הנני/ו מתחייבים להודיע למשרדכם בתוך 5 ימים",
        "במידה ושכרתי / רכשתי לאחר.",
        "",
        "במידה ואעביר אינפורמציה לאדם אחר / אקנה / אמכור / אשכיר / אשכור בדרככם או שלא בדרככם,",
        "אז הנני מתחייב לשלם לכם את מלוא שכר הטרחה המגיע לכם, כאילו אני/ו שכרתי/ו או/ו",
        "רכשתי/ו או/ו מכרתי/ו את הנכס הנ\"ל, כמפורט בסעיפים 5, 6 לעיל.",
        "",
        "במידה הקונים או השוכרים את הנכס על ידי משרד תיווך אחר מקודם שפנו אלינו אבל הנכס לא",
        "נמכר או נשכר על ידי אלה המתווכים המקודמים על ידינו יחולו דמי תיווך כרגיל לפי התנאים",
        "בסעיפים המקודמים לעיל."
      );

      commissionText.forEach(line => {
        if (y > 275) {
          pdf.addPage();
          y = 20;
        }
        pdf.text(line, 105, y, { align: "center", maxWidth: 180 });
        y += 4;
      });

      // Client signature section
      y += 8;
      if (y > 250) {
        pdf.addPage();
        y = 20;
      }
      
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "bold");
      pdf.text("חתימת הלקוח", 105, y, { align: "center" });
      y += 8;
      
      pdf.setFont("helvetica", "normal");
      pdf.text(`שם מלא: ${name}`, 105, y, { align: "center" });
      y += 6;
      pdf.text(`ת.ז / דרכון: ${idNumber}`, 105, y, { align: "center" });
      y += 6;
      pdf.text(`כתובת: ${address}`, 105, y, { align: "center" });
      y += 6;
      pdf.text(`טלפון: ${phone}`, 105, y, { align: "center" });
      y += 10;
      
      // Signature image
      const signatureData = canvas.toDataURL("image/png");
      pdf.text("חתימה:", 105, y, { align: "center" });
      y += 5;
      pdf.addImage(signatureData, "PNG", 65, y, 80, 30);

    } else {
      // ===== זכרון דברים =====
      
      pdf.setFontSize(18);
      pdf.setFont("helvetica", "bold");
      pdf.text("זיכרון דברים", 105, 20, { align: "center" });

      let y = 35;
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");

      const propertyData = form.form_data as any;
      
      const memorandumText = [
        `אני החתום מטה ${name} ת.ז ${idNumber} מאשר בזאת כי ברצוני`,
        `לשכור את הדירה ברחוב ${propertyData.property_address || '_____________'} ת"א אשר הוצגה ע"י עדי צבריאל`,
        `מ"סיטי מרקט" נכסים בתאריך ${signatureDate}`,
        "",
        "ליידוע ולהלן כי בחתימתי על זיכרון דברים זה אני מתחייב לשכור את הדירה לפי התנאים לעיל",
        "ואשר מסרתי דמי הרצינות ובמידה ואם בעל הדירה לא ימצא אותי כדייר ראוי זיכרון דברים זה",
        "יבוטל ודמי הרצינות יוחזרו אליי. במקרה של ביטול מכל סיבה אחרת דמי הרצינות לא יוחזרו",
        "אליי או תהיה אי הסכמה על סעיפים מהותיים בחוזה שיועבר לי ע\"י בעל הנכס, ואשר השגותיי",
        "עליהם בכתב.",
        "",
        "בחתימתי על זיכרון דברים זה אני מקנה לעצמי זכות ראשונים לשכור נכס זה ע\"י המתווך הנ\"לה",
        "",
        "סכום דמי הרצינות שניתנו על החשבון הם שווי ערך לעמלת התיווך:",
        "___________________",
        "",
        "צ'ק פיקדון זה יופקד לאחר חתימת החוזה.",
        ""
      ];

      memorandumText.forEach(line => {
        if (y > 270) {
          pdf.addPage();
          y = 20;
        }
        pdf.text(line, 105, y, { align: "center", maxWidth: 180 });
        y += 5;
      });

      // Property details section
      y += 3;
      pdf.setFont("helvetica", "bold");
      pdf.text("פרטים נוספים", 105, y, { align: "center" });
      y += 7;
      
      pdf.setFont("helvetica", "normal");
      
      if (propertyData.rental_price) {
        pdf.text(`מחיר השכירות: ${propertyData.rental_price}`, 105, y, { align: "center" });
        y += 6;
      }
      
      if (propertyData.guarantees) {
        pdf.text(`ערבויות: ${propertyData.guarantees}`, 105, y, { align: "center" });
        y += 6;
      }
      
      if (propertyData.entry_date) {
        pdf.text(`תאריך כניסה: ${propertyData.entry_date}`, 105, y, { align: "center" });
        y += 6;
      }
      
      if (propertyData.payment_method) {
        pdf.text(`צורת תשלום: ${propertyData.payment_method}`, 105, y, { align: "center" });
        y += 6;
      }
      
      if (propertyData.misc) {
        pdf.text(`שונות: ${propertyData.misc}`, 105, y, { align: "center" });
        y += 6;
      }

      // Signature section
      y += 10;
      if (y > 250) {
        pdf.addPage();
        y = 20;
      }
      
      pdf.text("עדי צבריאל", 105, y, { align: "center" });
      y += 10;
      pdf.text(`השוכר: ${name}`, 105, y, { align: "center" });
      y += 10;
      
      // Signature image
      const signatureData = canvas.toDataURL("image/png");
      pdf.text("חתימה:", 105, y, { align: "center" });
      y += 5;
      pdf.addImage(signatureData, "PNG", 75, y, 60, 25);
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
