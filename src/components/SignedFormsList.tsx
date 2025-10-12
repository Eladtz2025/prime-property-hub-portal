import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileSignature, Download, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { he } from "date-fns/locale";

interface SignedForm {
  id: string;
  form_type: string;
  signed_by_name: string;
  signed_by_id_number: string;
  signed_at: string;
  status: string;
  form_data: any;
  signature_data: string;
  sent_to_phone: string;
}

export const SignedFormsList = () => {
  const [forms, setForms] = useState<SignedForm[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadForms();
  }, []);

  const loadForms = async () => {
    try {
      const { data, error } = await supabase
        .from("signature_forms")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setForms(data || []);
    } catch (error: any) {
      console.error("Error loading forms:", error);
      toast({
        title: "שגיאה",
        description: "לא ניתן לטעון את הטפסים",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "signed":
        return <Badge className="bg-green-500">נחתם</Badge>;
      case "sent":
        return <Badge className="bg-yellow-500">נשלח</Badge>;
      case "expired":
        return <Badge variant="destructive">פג תוקף</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getFormTypeName = (type: string) => {
    return type === "brokerage_order" ? "הזמנת שירותי תיווך" : type;
  };

  if (loading) {
    return <div>טוען...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <FileSignature className="h-6 w-6" />
        <h2 className="text-2xl font-bold">טפסים חתומים</h2>
      </div>

      {forms.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              אין טפסים חתומים
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {forms.map((form) => (
            <Card key={form.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    {getFormTypeName(form.form_type)}
                  </CardTitle>
                  {getStatusBadge(form.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {form.signed_by_name && (
                    <div>
                      <span className="font-semibold">שם:</span> {form.signed_by_name}
                    </div>
                  )}
                  {form.signed_by_id_number && (
                    <div>
                      <span className="font-semibold">ת.ז:</span> {form.signed_by_id_number}
                    </div>
                  )}
                  {form.sent_to_phone && (
                    <div>
                      <span className="font-semibold">טלפון:</span> {form.sent_to_phone}
                    </div>
                  )}
                  {form.form_data?.property_address && (
                    <div>
                      <span className="font-semibold">נכס:</span> {form.form_data.property_address}
                    </div>
                  )}
                  {form.signed_at && (
                    <div>
                      <span className="font-semibold">תאריך חתימה:</span>{" "}
                      {format(new Date(form.signed_at), "dd/MM/yyyy HH:mm", { locale: he })}
                    </div>
                  )}
                </div>

                {form.status === "signed" && form.signature_data && (
                  <div className="mt-4 p-4 bg-gray-50 rounded">
                    <p className="text-sm font-semibold mb-2">חתימה:</p>
                    <img
                      src={form.signature_data}
                      alt="חתימה"
                      className="max-w-xs border border-gray-300 rounded"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
