'use client';

import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Camera, Edit2, Mail, Percent, Plus, Scissors, Trash2, UserRound, X } from 'lucide-react';
import { useStore } from '@/store/useStore';

const CATEGORY_OPTIONS = [
  { value: 'BARBER', label: 'Barbeiro' },
  { value: 'HAIRDRESSER', label: 'Cabeleireira(o)' },
  { value: 'MANICURE_PEDICURE', label: 'Manicure/Pedicure' },
  { value: 'OTHER', label: 'Outro' },
];

const categoryLabel = (value: string) =>
  CATEGORY_OPTIONS.find((option) => option.value === value)?.label || 'Profissional';

export default function EmployeesManager() {
  const token = useStore((state) => state.token);
  const addNotification = useStore((state) => state.addNotification);
  const queryClient = useQueryClient();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<any>(null);
  const [deletingEmployeeId, setDeletingEmployeeId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    categoria: 'BARBER',
    especialidade: '',
    fotoUrl: '',
    commissionRate: '50',
  });

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

  const { data: employees = [], isLoading, error } = useQuery({
    queryKey: ['barbers'],
    queryFn: () =>
      fetch(`${apiUrl}/barbers`).then((res) => {
        if (!res.ok) throw new Error('Falha ao carregar profissionais');
        return res.json();
      }),
  });

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingEmployee(null);
    setFormData({
      nome: '',
      email: '',
      senha: '',
      categoria: 'BARBER',
      especialidade: '',
      fotoUrl: '',
      commissionRate: '50',
    });
  };

  const invalidateEmployees = () => {
    queryClient.invalidateQueries({ queryKey: ['barbers'] });
  };

  const createEmployeeMutation = useMutation({
    mutationFn: (payload: any) =>
      fetch(`${apiUrl}/barbers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      }).then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Erro ao cadastrar profissional');
        return data;
      }),
    onSuccess: () => {
      invalidateEmployees();
      addNotification({
        title: 'Profissional cadastrado',
        description: 'O profissional foi adicionado com sucesso.',
        type: 'success',
      });
      closeModal();
    },
    onError: (error: any) => {
      addNotification({
        title: 'Erro ao cadastrar',
        description: error.message || 'Não foi possível cadastrar o profissional.',
        type: 'error',
      });
    },
  });

  const updateEmployeeMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) =>
      fetch(`${apiUrl}/barbers/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      }).then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Erro ao atualizar profissional');
        return data;
      }),
    onSuccess: () => {
      invalidateEmployees();
      addNotification({
        title: 'Profissional atualizado',
        description: 'Os dados do profissional foram atualizados.',
        type: 'success',
      });
      closeModal();
    },
    onError: (error: any) => {
      addNotification({
        title: 'Erro ao atualizar',
        description: error.message || 'Não foi possível atualizar o profissional.',
        type: 'error',
      });
    },
  });

  const deleteEmployeeMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`${apiUrl}/barbers/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }).then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Erro ao excluir profissional');
        return data;
      }),
    onSuccess: () => {
      invalidateEmployees();
      addNotification({
        title: 'Profissional removido',
        description: 'O profissional foi removido da equipe.',
        type: 'success',
      });
      setDeletingEmployeeId(null);
    },
    onError: (error: any) => {
      addNotification({
        title: 'Erro ao excluir',
        description: error.message || 'Não foi possível excluir o profissional.',
        type: 'error',
      });
      setDeletingEmployeeId(null);
    },
  });

  const openCreateModal = () => {
    setEditingEmployee(null);
    setFormData({
      nome: '',
      email: '',
      senha: '',
      categoria: 'BARBER',
      especialidade: '',
      fotoUrl: '',
      commissionRate: '50',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (employee: any) => {
    setEditingEmployee(employee);
    setFormData({
      nome: employee.user.nome,
      email: employee.user.email,
      senha: '',
      categoria: employee.categoria || 'BARBER',
      especialidade: employee.especialidade || '',
      fotoUrl: employee.fotoUrl || '',
      commissionRate: String(employee.commissionRate ?? 50),
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!formData.nome || !formData.email || !formData.especialidade) {
      addNotification({
        title: 'Campos obrigatórios',
        description: 'Preencha nome, e-mail e especialidade.',
        type: 'warning',
      });
      return;
    }

    if (!editingEmployee && !formData.senha) {
      addNotification({
        title: 'Senha obrigatória',
        description: 'Defina uma senha inicial para o profissional.',
        type: 'warning',
      });
      return;
    }

    const payload = {
      nome: formData.nome,
      email: formData.email,
      senha: formData.senha || undefined,
      categoria: formData.categoria,
      especialidade: formData.especialidade,
      fotoUrl: formData.fotoUrl || undefined,
      commissionRate: Number(formData.commissionRate || 50),
    };

    if (editingEmployee) {
      updateEmployeeMutation.mutate({ id: editingEmployee.id, payload });
      return;
    }

    createEmployeeMutation.mutate(payload);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="h-8 w-8 border-2 border-davinci-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl border border-red-200 text-red-500 p-8 text-center text-sm font-semibold">
        Não foi possível carregar a equipe no momento.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-zinc-200/85 shadow-sm">
        <div>
          <h3 className="text-sm font-bold text-davinci-black uppercase tracking-wider">Equipe do estabelecimento</h3>
          <p className="text-xs text-davinci-gray mt-1">
            Cadastre barbeiros, cabeleireiras, manicures/pedicures e outros profissionais da operação.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gold-gradient text-davinci-black text-xs font-bold shadow-sm cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Adicionar profissional
        </button>
      </div>

      {employees.length === 0 ? (
        <div className="bg-white rounded-xl border border-zinc-200/80 p-10 text-center shadow-sm">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-davinci-gold/10 border border-davinci-gold/20 flex items-center justify-center">
            <UserRound className="h-5 w-5 text-davinci-gold" />
          </div>
          <h4 className="text-sm font-bold text-davinci-black">Nenhum profissional cadastrado</h4>
          <p className="text-xs text-davinci-gray mt-2">
            Adicione a equipe para organizar agenda, atendimento e especialidades por profissional.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {employees.map((employee: any) => (
            <div
              key={employee.id}
              className="bg-white rounded-2xl border border-zinc-200/80 p-5 shadow-sm flex flex-col gap-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  {employee.fotoUrl ? (
                    <img
                      src={employee.fotoUrl}
                      alt={employee.user.nome}
                      className="w-14 h-14 rounded-full object-cover border border-davinci-gold/20"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-davinci-gold/10 border border-davinci-gold/20 flex items-center justify-center font-bold text-davinci-gold">
                      {employee.user.nome.charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-davinci-black truncate">{employee.user.nome}</h4>
                    <p className="text-[10px] uppercase tracking-wider font-bold text-davinci-gold mt-1">
                      {categoryLabel(employee.categoria)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(employee)}
                    className="p-1.5 rounded text-davinci-gray hover:text-davinci-gold hover:bg-zinc-50 cursor-pointer"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setDeletingEmployeeId(employee.id)}
                    className="p-1.5 rounded text-davinci-gray hover:text-red-500 hover:bg-red-50 cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex items-start gap-2 text-davinci-gray">
                  <Mail className="h-4 w-4 text-davinci-gold mt-0.5" />
                  <span className="break-all">{employee.user.email}</span>
                </div>

                <div className="flex items-start gap-2 text-davinci-gray">
                  <Scissors className="h-4 w-4 text-davinci-gold mt-0.5" />
                  <span>{employee.especialidade}</span>
                </div>

                <div className="flex items-start gap-2 text-davinci-gray">
                  <Percent className="h-4 w-4 text-davinci-gold mt-0.5" />
                  <span>Comissão: {Number(employee.commissionRate ?? 50).toFixed(0)}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/35 backdrop-blur-sm" onClick={closeModal} />

          <div className="relative z-10 w-full max-w-lg bg-white rounded-2xl border border-zinc-200 shadow-2xl p-6">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h4 className="text-sm font-bold text-davinci-black">
                  {editingEmployee ? 'Editar profissional' : 'Novo profissional'}
                </h4>
                <p className="text-xs text-davinci-gray mt-1">
                  Defina os dados de acesso, função, especialidade e foto da equipe.
                </p>
              </div>

              <button
                onClick={closeModal}
                className="p-1.5 rounded text-davinci-gray hover:text-davinci-black hover:bg-zinc-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-bold text-davinci-gray mb-1.5">
                    Nome completo
                  </label>
                  <input
                    value={formData.nome}
                    onChange={(event) => setFormData({ ...formData, nome: event.target.value })}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs focus:outline-none focus:border-davinci-gold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-bold text-davinci-gray mb-1.5">
                    Categoria
                  </label>
                  <select
                    value={formData.categoria}
                    onChange={(event) => setFormData({ ...formData, categoria: event.target.value })}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs focus:outline-none focus:border-davinci-gold"
                  >
                    {CATEGORY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-bold text-davinci-gray mb-1.5">
                    E-mail de acesso
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(event) => setFormData({ ...formData, email: event.target.value })}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs focus:outline-none focus:border-davinci-gold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-bold text-davinci-gray mb-1.5">
                    {editingEmployee ? 'Nova senha (opcional)' : 'Senha inicial'}
                  </label>
                  <input
                    type="password"
                    value={formData.senha}
                    onChange={(event) => setFormData({ ...formData, senha: event.target.value })}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs focus:outline-none focus:border-davinci-gold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider font-bold text-davinci-gray mb-1.5">
                  Especialidade
                </label>
                <textarea
                  rows={3}
                  value={formData.especialidade}
                  onChange={(event) => setFormData({ ...formData, especialidade: event.target.value })}
                  placeholder="Ex: cortes femininos, química capilar, barba, esmaltação em gel..."
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs resize-none focus:outline-none focus:border-davinci-gold"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider font-bold text-davinci-gray mb-1.5">
                  Comissão (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={formData.commissionRate}
                  onChange={(event) => setFormData({ ...formData, commissionRate: event.target.value })}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs focus:outline-none focus:border-davinci-gold"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider font-bold text-davinci-gray mb-1.5">
                  URL da foto
                </label>
                <div className="relative">
                  <Camera className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-davinci-gold" />
                  <input
                    value={formData.fotoUrl}
                    onChange={(event) => setFormData({ ...formData, fotoUrl: event.target.value })}
                    placeholder="https://..."
                    className="w-full pl-10 pr-3 py-2 border border-zinc-200 rounded-lg text-xs focus:outline-none focus:border-davinci-gold"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-xs font-semibold text-davinci-gray border border-zinc-200 rounded-lg hover:bg-zinc-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-davinci-black bg-gold-gradient rounded-lg shadow-sm cursor-pointer"
                >
                  {editingEmployee ? 'Salvar alterações' : 'Cadastrar profissional'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deletingEmployeeId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/35 backdrop-blur-sm" onClick={() => setDeletingEmployeeId(null)} />
          <div className="relative z-10 w-full max-w-sm bg-white rounded-2xl border border-zinc-200 shadow-2xl p-6">
            <h4 className="text-sm font-bold text-davinci-black">Excluir profissional</h4>
            <p className="text-xs text-davinci-gray mt-2">
              Esta ação remove o profissional e o acesso dele ao sistema.
            </p>
            <div className="flex justify-end gap-3 pt-5">
              <button
                onClick={() => setDeletingEmployeeId(null)}
                className="px-4 py-2 text-xs font-semibold text-davinci-gray border border-zinc-200 rounded-lg hover:bg-zinc-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => deleteEmployeeMutation.mutate(deletingEmployeeId)}
                className="px-4 py-2 text-xs font-bold text-white bg-red-500 rounded-lg hover:bg-red-600 cursor-pointer"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
