import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';
import ReceiptModal from '../components/ReceiptModal';

export default function Receipt() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const { data: donation, isLoading, error } = useQuery({
    queryKey: ['receipt', id],
    queryFn: async () => {
      // it might be receiptNo or _id, the existing backend allows receiptNo
      const { data } = await api.get(`/donations/receipt/${id}`);
      return data;
    }
  });

  if (isLoading) return <div className="p-8 text-center">रसीद लोड हो रही है...</div>;
  if (error || !donation) return <div className="p-8 text-center text-red-600">रसीद लोड करने में त्रुटि</div>;

  // Since this is a standalone route, provide an onClose that just goes back
  return <ReceiptModal donation={donation} onClose={() => navigate(-1)} />;
}
