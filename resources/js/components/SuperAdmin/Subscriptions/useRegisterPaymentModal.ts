import { useMemo, useEffect } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import { SubscriptionPlanEnum } from "@/enums/SubscriptionPlanEnum";
import { logUnexpectedError } from "@/plugins/logger.plugin";
import { ITenantWithSubscription } from "@/models/ISubscription";
import { useRegisterPayment } from "@/services/useSubscriptionService";

const schema = Yup.object({
    plan:      Yup.string().oneOf(Object.values(SubscriptionPlanEnum)).required("Requerido"),
    starts_at: Yup.string().required("Requerido"),
    amount:    Yup.number().nullable().min(0),
    notes:     Yup.string().nullable().max(300),
});

const parseDateLocal = (dateStr: string): Date | null => {
    const parts = dateStr.split("-").map(Number);
    if (parts.length !== 3 || parts.some(isNaN)) return null;
    return new Date(parts[0], parts[1] - 1, parts[2]);
};

const computeExpiresAt = (plan: string, startsAt: string): string | null => {
    const d = parseDateLocal(startsAt);
    if (!d) return null;

    if (plan === SubscriptionPlanEnum.Lifetime) return null;
    if (plan === SubscriptionPlanEnum.Weekly)   d.setDate(d.getDate() + 7);
    else if (plan === SubscriptionPlanEnum.Biweekly) d.setDate(d.getDate() + 14);
    else {
        const months: Record<string, number> = {
            monthly: 1, biannual: 6, annual: 12,
        };
        const m = months[plan] ?? 0;
        if (m === 0) return null;
        d.setMonth(d.getMonth() + m);
    }

    return d.toLocaleDateString("es-MX", { day: "2-digit", month: "long", year: "numeric" });
};

const today = () => new Date().toISOString().split("T")[0];

const defaultValues = (plan: SubscriptionPlanEnum = SubscriptionPlanEnum.Monthly) => ({
    plan,
    starts_at: today(),
    amount:    "" as unknown as number,
    notes:     "",
});

export const useRegisterPaymentModal = (tenant: ITenantWithSubscription | null, onClose: () => void) => {
    const { mutateAsync } = useRegisterPayment();

    const formik = useFormik({
        initialValues: defaultValues(),
        validationSchema: schema,
        onSubmit: async (values, { setSubmitting, resetForm }) => {
            if (!tenant) return;
            try {
                await mutateAsync({
                    tenantId: tenant.id,
                    data: {
                        plan:      values.plan as SubscriptionPlanEnum,
                        starts_at: values.starts_at,
                        amount:    values.amount || null,
                        notes:     values.notes || null,
                    },
                });
                toast.success("Pago registrado correctamente.");
                resetForm();
                onClose();
            } catch (error) {

                logUnexpectedError(error, "useRegisterPaymentModal.onSubmit");
                toast.error("No se pudo registrar el pago.");
            } finally {
                setSubmitting(false);
            }
        },
    });

    useEffect(() => {
        if (tenant) {
            const currentPlan = tenant.subscription_plan ?? SubscriptionPlanEnum.Monthly;
            formik.resetForm({ values: defaultValues(currentPlan) });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tenant?.id]);

    const isLifetime = formik.values.plan === SubscriptionPlanEnum.Lifetime;

    const expiresAt = useMemo(
        () => computeExpiresAt(formik.values.plan, formik.values.starts_at),
        [formik.values.plan, formik.values.starts_at],
    );

    return { formik, isLifetime, expiresAt };
};
