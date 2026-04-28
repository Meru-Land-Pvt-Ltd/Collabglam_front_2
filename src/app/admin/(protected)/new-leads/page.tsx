"use client";

import { useEffect, useState } from "react";
import AdminTable, { type AdminTableColumn } from "../../components/table";

type MatchedCreator = {
    _id: string;
    productType: string;
    budget: string;
    market: string;
    email: string;
    createdAt: string;
};

const MatchedCreatorsPage = () => {
    const [data, setData] = useState<MatchedCreator[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const columns: AdminTableColumn<MatchedCreator>[] = [
        {
            id: "productType",
            header: "Product Type",
            render: (row) => row.productType,
        },
        {
            id: "budget",
            header: "Budget",
            render: (row) => row.budget,
        },
        {
            id: "market",
            header: "Market",
            render: (row) => row.market,
        },
        {
            id: "email",
            header: "Email",
            render: (row) => row.email,
        },
        {
            id: "createdAt",
            header: "Submitted Date",
            render: (row) =>
                new Date(row.createdAt).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                }),
        },
    ];

    const fetchMatchedCreators = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}matched-creators/list`
            );

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.message || "Failed to fetch matched creators.");
            }

            setData(result.data || []);
        } catch (error) {
            console.error("Error fetching matched creators:", error);
            setError("Unable to fetch matched creator requests.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMatchedCreators();
    }, []);

    return (
        <div className="w-full px-4 py-6">
            <div className="w-full">
                <h1 className="mb-6 text-2xl font-semibold text-gray-900">
                    New Leads
                </h1>

                <AdminTable
                    columns={columns}
                    data={data}
                    loading={loading}
                    error={error}
                    rowKey={(row) => row._id}
                    emptyTitle="No matched creator requests found"
                    emptyDescription="New matched creator form submissions will appear here."
                    className="w-full"
                    containerClassName="w-full"
                    tableClassName="w-full"
                />
            </div>
        </div>
    );
};

export default MatchedCreatorsPage;