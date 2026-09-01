import { useState } from "react";
import { IProduct } from "@/models/IProduct";

// Apertura/cierre del modal de alta/edición de producto y el producto en edición (null = alta).
export const useProductModalState = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<IProduct | null>(null);

    const handleCloseModal = () => setIsModalOpen(false);

    const openAddModal = () => {
        setEditingProduct(null);
        setIsModalOpen(true);
    };

    const openEditModal = (product: IProduct) => {
        setEditingProduct(product);
        setIsModalOpen(true);
    };

    return { isModalOpen, editingProduct, openAddModal, openEditModal, handleCloseModal };
};
