import { useEffect, useMemo, useState, type BaseSyntheticEvent } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { FormField, FormFieldInput, FormFieldSelect } from "@/components/shared/FormField";
import { PersianDatePicker } from "@/components/elements/PersianDatePicker";
import { realEstateApi } from "@/api/real-estate";
import type { Property } from "@/types/real_estate/realEstate";
import { showError, showSuccess } from "@/core/toast";
import { getCrud } from "@/core/messages/ui";
import { TaxonomyDrawer } from "@/components/templates/TaxonomyDrawer";

interface FinalizeDealDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  property: Property;
  onSuccess?: () => void;
}

export function FinalizeDealDialog({ open, onOpenChange, property, onSuccess }: FinalizeDealDialogProps) {
  const [dealType, setDealType] = useState<string>("sale");
  const [finalAmount, setFinalAmount] = useState<string>("");
  const [salePrice, setSalePrice] = useState<string>("");
  const [preSalePrice, setPreSalePrice] = useState<string>("");
  const [monthlyRent, setMonthlyRent] = useState<string>("");
  const [rentAmount, setRentAmount] = useState<string>("");
  const [securityDeposit, setSecurityDeposit] = useState<string>("");
  const [mortgageAmount, setMortgageAmount] = useState<string>("");
  const [contractDate, setContractDate] = useState<string>("");
  const [responsibleAgent, setResponsibleAgent] = useState<string>(property.agent?.id ? String(property.agent.id) : "");
  const [commission, setCommission] = useState<string>("");

  const normalizeDealType = (value?: string) => {
    const allowed = ["sale", "rent", "presale", "exchange", "mortgage"];
    return value && allowed.includes(value) ? value : "sale";
  };

  useEffect(() => {
    if (!open) return;
    setResponsibleAgent(property.agent?.id ? String(property.agent.id) : "");
    setDealType(normalizeDealType(property.state?.usage_type));
    setSalePrice(property.sale_price ? String(property.sale_price) : "");
    setPreSalePrice(property.pre_sale_price ? String(property.pre_sale_price) : "");
    setMonthlyRent(property.monthly_rent ? String(property.monthly_rent) : "");
    setRentAmount(property.rent_amount ? String(property.rent_amount) : "");
    setSecurityDeposit(property.security_deposit ? String(property.security_deposit) : "");
    setMortgageAmount(property.mortgage_amount ? String(property.mortgage_amount) : "");
    setFinalAmount("");
    setContractDate("");
    setCommission("");
  }, [open, property.agent?.id, property.state?.usage_type]);

  const { data: fieldOptions } = useQuery({
    queryKey: ["property-field-options"],
    queryFn: () => realEstateApi.getFieldOptions(),
    staleTime: 1000 * 60 * 30,
  });

  const { data: agentsResponse } = useQuery({
    queryKey: ["property-agents", "for-finalize"],
    queryFn: () => realEstateApi.getAgents({ page: 1, size: 200, is_active: true }),
    staleTime: 1000 * 60 * 10,
  });

  const listingTypeOptions = useMemo(() => {
    const options = fieldOptions?.listing_type || [];
    const filtered = options.filter(([value]) => value !== "other");
    return filtered.map(([value, label]) => ({ value, label }));
  }, [fieldOptions?.listing_type]);

  const agentsOptions = useMemo(() => {
    return (agentsResponse?.data || []).map((agent) => ({
      value: String(agent.id),
      label: agent.full_name || `${agent.first_name || ""} ${agent.last_name || ""}`.trim() || `مشاور #${agent.id}`,
    }));
  }, [agentsResponse?.data]);

  const finalizeMutation = useMutation({
    mutationFn: () =>
      realEstateApi.finalizeDeal(property.id, {
        deal_type: dealType,
        final_amount: finalAmount !== "" ? Number(finalAmount) : (dealType === "rent" && monthlyRent !== "" ? Number(monthlyRent) : null),
        sale_price: salePrice !== "" ? Number(salePrice) : null,
        pre_sale_price: preSalePrice !== "" ? Number(preSalePrice) : null,
        monthly_rent: monthlyRent !== "" ? Number(monthlyRent) : null,
        rent_amount: rentAmount !== "" ? Number(rentAmount) : null,
        security_deposit: securityDeposit !== "" ? Number(securityDeposit) : null,
        mortgage_amount: mortgageAmount !== "" ? Number(mortgageAmount) : null,
        contract_date: contractDate || null,
        responsible_agent: responsibleAgent !== "" ? Number(responsibleAgent) : null,
        commission: commission !== "" ? Number(commission) : null,
      }),
    onSuccess: () => {
      showSuccess(getCrud("saved", { item: "معامله" }));
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error) => {
      showError(error);
    },
  });

  const isClosed = property.status === "sold" || property.status === "rented";

  const handleSubmit = async (event?: BaseSyntheticEvent) => {
    event?.preventDefault();
    if (isClosed || finalizeMutation.isPending || !canSubmit) return;
    await finalizeMutation.mutateAsync();
  };

  const amountLabel = dealType === "rent" ? "اجاره ماهانه نهایی" : "مبلغ نهایی قرارداد";
  const showSalePrice = dealType === "sale";
  const showPreSalePrice = dealType === "presale";
  const showRentFields = dealType === "rent";
  const showFinalAmount = dealType === "exchange" || dealType === "mortgage";
  const canSubmit = contractDate !== "" && (
    (showSalePrice && salePrice !== "") ||
    (showPreSalePrice && preSalePrice !== "") ||
    (showRentFields && monthlyRent !== "") ||
    (showFinalAmount && finalAmount !== "")
  );

  return (
    <TaxonomyDrawer
      isOpen={open}
      onClose={() => onOpenChange(false)}
      title="نهایی‌سازی معامله ملک"
      onSubmit={handleSubmit}
      isPending={finalizeMutation.isPending}
      isSubmitting={false}
      submitButtonText="ثبت نهایی معامله"
      cancelButtonText="انصراف"
      formId="finalize-deal-form"
    >
      <div className="space-y-1">
        <p className="text-xs text-font-s leading-relaxed">{property.title}</p>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <FormFieldSelect
              label="نوع معامله"
              value={dealType}
              onValueChange={setDealType}
              options={listingTypeOptions.length > 0 ? listingTypeOptions : [
                { value: "sale", label: "فروش" },
                { value: "rent", label: "رهن و اجاره" },
                { value: "mortgage", label: "رهن کامل" },
                { value: "presale", label: "پیش‌فروش" },
                { value: "exchange", label: "معاوضه" },
              ]}
              placeholder="نوع معامله را انتخاب کنید"
              required
            />

            <FormField label="تاریخ قرارداد" required>
              <PersianDatePicker
                value={contractDate}
                onChange={setContractDate}
                placeholder="تاریخ قرارداد"
              />
            </FormField>

            <FormFieldSelect
              label="مشاور مسئول (اختیاری)"
              value={responsibleAgent}
              onValueChange={setResponsibleAgent}
              options={agentsOptions}
              placeholder={property.agent?.full_name ? `پیش‌فرض: ${property.agent.full_name}` : "در صورت عدم انتخاب، مشاور فعلی"}
            />

            <FormFieldInput
              label="کمیسیون"
              type="number"
              min={0}
              value={commission}
              onChange={(e) => setCommission(e.target.value)}
              placeholder="مثلاً 50000000"
            />

            {showSalePrice ? (
              <FormFieldInput
                label="مبلغ نهایی فروش"
                type="number"
                min={0}
                value={salePrice}
                onChange={(e) => setSalePrice(e.target.value)}
                placeholder="مثلاً 2500000000"
                className="lg:col-span-2"
              />
            ) : null}

            {showPreSalePrice ? (
              <FormFieldInput
                label="مبلغ نهایی پیش‌فروش"
                type="number"
                min={0}
                value={preSalePrice}
                onChange={(e) => setPreSalePrice(e.target.value)}
                placeholder="مثلاً 1800000000"
                className="lg:col-span-2"
              />
            ) : null}

            {showRentFields ? (
              <>
                <FormFieldInput
                  label="اجاره ماهانه نهایی"
                  type="number"
                  min={0}
                  value={monthlyRent}
                  onChange={(e) => setMonthlyRent(e.target.value)}
                  placeholder="مثلاً 30000000"
                />
                <FormFieldInput
                  label="مبلغ اجاره (اختیاری)"
                  type="number"
                  min={0}
                  value={rentAmount}
                  onChange={(e) => setRentAmount(e.target.value)}
                  placeholder="مثلاً 120000000"
                />
                <FormFieldInput
                  label="ودیعه / رهن کامل (اختیاری)"
                  type="number"
                  min={0}
                  value={securityDeposit}
                  onChange={(e) => setSecurityDeposit(e.target.value)}
                  placeholder="مثلاً 800000000"
                />
                <FormFieldInput
                  label="مبلغ رهن (اختیاری)"
                  type="number"
                  min={0}
                  value={mortgageAmount}
                  onChange={(e) => setMortgageAmount(e.target.value)}
                  placeholder="مثلاً 500000000"
                />
              </>
            ) : null}

            {showFinalAmount ? (
              <FormFieldInput
                label={amountLabel}
                type="number"
                min={0}
                value={finalAmount}
                onChange={(e) => setFinalAmount(e.target.value)}
                placeholder="مثلاً 2500000000"
                className="lg:col-span-2"
              />
            ) : null}
        </div>

        {isClosed ? <p className="text-xs text-red-1 font-bold">این ملک قبلاً نهایی شده و امکان نهایی‌سازی مجدد ندارد.</p> : null}
      </div>
    </TaxonomyDrawer>
  );
}
