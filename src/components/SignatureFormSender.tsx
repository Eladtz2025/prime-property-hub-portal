import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { FileSignature, Loader2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

interface SignatureFormSenderProps {
  properties?: Array<{ id: string; address: string; }>;
}

export const SignatureFormSender = ({ properties = [] }: SignatureFormSenderProps) => {
  const [open, setOpen] = useState(false);
  const [formType, setFormType] = useState<"memorandum" | "brokerage_order">("brokerage_order");
  const [propertyId, setPropertyId] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Fields for memorandum form
  const [rentalPrice, setRentalPrice] = useState("");
  const [guarantees, setGuarantees] = useState("");
  const [entryDate, setEntryDate] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [misc, setMisc] = useState("");

  // Fields for brokerage order form
  const [propertyAddress, setPropertyAddress] = useState("");
  const [floor, setFloor] = useState("");
  const [price, setPrice] = useState("");
  const [transactionType, setTransactionType] = useState<"rental" | "sale">("rental");
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientAddress, setClientAddress] = useState("");

  const handleSendForm = async () => {
    if (!phone) {
      toast({
        title: "שגיאה",
        description: "נא למלא טלפון",
        variant: "destructive",
      });
      return;
    }

    if (formType === "brokerage_order" && (!propertyAddress || !price)) {
      toast({
        title: "שגיאה",
        description: "נא למלא כתובת נכס ומחיר",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "שגיאה",
          description: "משתמש לא מחובר",
          variant: "destructive",
        });
        return;
      }

      // Get property address from selected property if available
      let selectedPropertyAddress = "";
      if (propertyId) {
        const property = properties.find(p => p.id === propertyId);
        selectedPropertyAddress = property?.address || "";
      }

      // Build form data based on form type
      let formData: any = {};

      if (formType === "memorandum") {
        formData = {
          property_address: selectedPropertyAddress,
          rental_price: rentalPrice,
          guarantees,
          entry_date: entryDate,
          payment_method: paymentMethod,
          misc,
        };
      } else if (formType === "brokerage_order") {
        formData = {
          property_address: propertyAddress,
          floor,
          price,
          transaction_type: transactionType,
          client_name: clientName,
          client_phone: clientPhone,
          client_address: clientAddress,
        };
      }

      const { data, error } = await supabase
        .from("signature_forms")
        .insert({
          form_type: formType,
          property_id: propertyId || null,
          form_data: formData,
          sent_to_phone: phone,
          sent_to_email: email || null,
          sent_by: user.id,
          status: "sent",
        })
        .select()
        .single();

      if (error) throw error;

      const signatureUrl = `${window.location.origin}/sign/${data.token}`;
      
      toast({
        title: "הטופס נשלח בהצלחה!",
        description: `קישור לחתימה: ${signatureUrl}`,
      });

      // Reset form
      setOpen(false);
      setPhone("");
      setEmail("");
      setPropertyId("");
      setRentalPrice("");
      setGuarantees("");
      setEntryDate("");
      setPaymentMethod("");
      setMisc("");
      setPropertyAddress("");
      setFloor("");
      setPrice("");
      setTransactionType("rental");
      setClientName("");
      setClientPhone("");
      setClientAddress("");
    } catch (error: any) {
      toast({
        title: "שגיאה",
        description: error.message || "אירעה שגיאה בשליחת הטופס",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <FileSignature className="h-4 w-4" />
          שליחת טופס חתימה
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>שליחת טופס לחתימה דיגיטלית</DialogTitle>
          <DialogDescription>
            בחר סוג טופס ומלא את הפרטים
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="formType">סוג טופס *</Label>
            <Select value={formType} onValueChange={(value: any) => setFormType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="memorandum">זכרון דברים</SelectItem>
                <SelectItem value="brokerage_order">הזמנת שירותי תיווך</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">טלפון לקוח *</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="050-1234567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">אימייל לקוח (אופציונלי)</Label>
            <Input
              id="email"
              type="email"
              placeholder="example@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {formType === "memorandum" && (
            <>
              {properties.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="property">נכס (אופציונלי)</Label>
                  <Select value={propertyId} onValueChange={setPropertyId}>
                    <SelectTrigger>
                      <SelectValue placeholder="בחר נכס" />
                    </SelectTrigger>
                    <SelectContent>
                      {properties.map((property) => (
                        <SelectItem key={property.id} value={property.id}>
                          {property.address}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="rentalPrice">דמי שכירות חודשי</Label>
                <Input
                  id="rentalPrice"
                  placeholder="5000 ₪"
                  value={rentalPrice}
                  onChange={(e) => setRentalPrice(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="guarantees">ערבויות</Label>
                <Input
                  id="guarantees"
                  placeholder="ערב אחד / שני ערבים"
                  value={guarantees}
                  onChange={(e) => setGuarantees(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="entryDate">תאריך כניסה</Label>
                <Input
                  id="entryDate"
                  type="date"
                  value={entryDate}
                  onChange={(e) => setEntryDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentMethod">אמצעי תשלום</Label>
                <Input
                  id="paymentMethod"
                  placeholder="העברה בנקאית / צ'קים"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="misc">שונות</Label>
                <Textarea
                  id="misc"
                  placeholder="מידע נוסף..."
                  value={misc}
                  onChange={(e) => setMisc(e.target.value)}
                />
              </div>
            </>
          )}

          {formType === "brokerage_order" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="transactionType">סוג עסקה *</Label>
                <Select value={transactionType} onValueChange={(value: any) => setTransactionType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rental">שכירות</SelectItem>
                    <SelectItem value="sale">מכירה/קנייה</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="propertyAddress">כתובת הנכס *</Label>
                <Input
                  id="propertyAddress"
                  placeholder="רחוב, מספר, עיר"
                  value={propertyAddress}
                  onChange={(e) => setPropertyAddress(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="floor">קומה</Label>
                <Input
                  id="floor"
                  placeholder="3"
                  value={floor}
                  onChange={(e) => setFloor(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">מחיר *</Label>
                <Input
                  id="price"
                  placeholder="5000"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>

              {properties.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="property">קישור לנכס (אופציונלי)</Label>
                  <Select value={propertyId} onValueChange={setPropertyId}>
                    <SelectTrigger>
                      <SelectValue placeholder="בחר נכס" />
                    </SelectTrigger>
                    <SelectContent>
                      {properties.map((property) => (
                        <SelectItem key={property.id} value={property.id}>
                          {property.address}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={() => setOpen(false)}>
            ביטול
          </Button>
          <Button onClick={handleSendForm} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            שלח טופס
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
