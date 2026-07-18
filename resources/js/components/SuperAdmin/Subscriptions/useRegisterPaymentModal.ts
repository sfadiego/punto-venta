import { useMemo, useEffect } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import { SubscriptionPlanEnum } from "@/enums/SubscriptionPlanEnum";
import { logUnexpectedError } from "@/plugins/logger.plugin";
import { ITenantWithSubscription } from "@/models/ISubscription";
import { useRegisterPayment } from "@/services/useSubscriptionService";
import { localDateString, computeExpiresAt } from "@/utils/dateUtils";

const schema = Yup.object({
    plan:      Yup.string().oneOf(Object.values(SubscriptionPlanEnum)).required("Requerido"),
    starts_at: Yup.string().required("Requerido"),
    amount:    Yup.number().nullable().min(0),
    notes:     Yup.string().nullable().max(300),
});

const today = () => localDateString();

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
