'use client';

import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BadgeCheck, Edit2, Lock, Mail, Plus, Shield, ToggleLeft, ToggleRight, Trash2, UserRound, X } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { ROLE_LABELS, type StaffRole, getRoleLabels } from '@/lib/auth';

const ROLE_OPTIONS: Array<{ value: StaffRole; label: string }> = [
  { value: 'ADMIN', label: ROLE_LABELS.ADMIN },
  { value: 'ATTENDANT', label: ROLE_LABELS.ATTENDANT },
  { value: 'BARBER', label: ROLE_LABELS.BARBER },
  { value: 'HAIRDRESSER', label: ROLE_LABELS.HAIRDRESSER },
  { value: 'MANICURE_PEDICURE', label: ROLE_LABELS.MANICURE_PEDICURE },
];

const PROFESSIONAL_ROLES: StaffRole[] = ['BARBER', 'HAIRDRESSER', 'MANICURE_PEDICURE'];

function hasProfessionalRole(roles: string[]) {
  return roles.some((role) => PROFESSIONAL_ROLES.includes(role as StaffRole));
}

function normalizePrimaryRole(roles: string[], currentRole?: string) {
  if (currentRole && roles.includes(currentRole)) return currentRole as StaffRole;
  return (roles[0] as StaffRole) || 'ATTENDANT';
}

export default function UsersManager() {
  const token = useStore((state) => state.token);
  const addNotification = useStore((state) => state.addNotification);
  const queryClient = useQueryClient();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    roles: ['ATTENDANT'] as string[],
    role: 'ATTENDANT' as StaffRole,
    isActive: true,
    especialidade: '',
    fotoUrl: '',
    commissionRate: '50',
  });

  const { data: users = [], isLoading, error } = useQuery({
    queryKey: ['users'],
    queryFn: () =>
      fetch(`${apiUrl}/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }).then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Falha ao carregar usuários');
        return data;
      }),
    enabled: !!token,
  });

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
    setFormData({
      nome: '',
      email: '',
      senha: '',
      roles: ['ATTENDANT'],
      role: 'ATTENDANT',
      isActive: true,
      especialidade: '',
      fotoUrl: '',
      commissionRate: '50',
    });
  };

  const invalidateUsers = () => {
    queryClient.invalidateQueries({ queryKey: ['users'] });
    queryClient.invalidateQueries({ queryKey: ['barbers'] });
  };

  const createUserMutation = useMutation({
    mutationFn: (payload: any) =>
      fetch(`${apiUrl}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      }).then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Erro ao cadastrar usuário');
        return data;
      }),
    onSuccess: () => {
      invalidateUsers();
      addNotification({
        title: 'Usuário cadastrado',
        description: 'A conta foi criada com sucesso.',
        type: 'success',
      });
      closeModal();
    },
    onError: (error: any) => {
      addNotification({
        title: 'Erro ao cadastrar',
        description: error.message || 'Não foi possível criar a conta.',
        type: 'error',
      });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) =>
      fetch(`${apiUrl}/users/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      }).then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Erro ao atualizar usuário');
        return data;
      }),
    onSuccess: () => {
      invalidateUsers();
      addNotification({
        title: 'Usuário atualizado',
        description: 'As permissões e dados da conta foram atualizados.',
        type: 'success',
      });
      closeModal();
    },
    onError: (error: any) => {
      addNotification({
        title: 'Erro ao atualizar',
        description: error.message || 'Não foi possível atualizar o usuário.',
        type: 'error',
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`${apiUrl}/users/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }).then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Erro ao excluir usuário');
        return data;
      }),
    onSuccess: () => {
      invalidateUsers();
      addNotification({
        title: 'Usuário removido',
        description: 'A conta foi excluída do sistema.',
        type: 'success',
      });
      setDeletingUserId(null);
    },
    onError: (error: any) => {
      addNotification({
        title: 'Erro ao excluir',
        description: error.message || 'Não foi possível excluir o usuário.',
        type: 'error',
      });
      setDeletingUserId(null);
    },
  });

  const toggleUserStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      fetch(`${apiUrl}/users/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive }),
      }).then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Erro ao alterar status');
        return data;
      }),
    onSuccess: (_, variables) => {
      invalidateUsers();
      addNotification({
        title: variables.isActive ? 'Conta ativada' : 'Conta desativada',
        description: variables.isActive
          ? 'O usuário voltou a ter acesso ao sistema.'
          : 'O acesso do usuário foi bloqueado.',
        type: 'success',
      });
    },
    onError: (error: any) => {
      addNotification({
        title: 'Erro ao alterar status',
        description: error.message || 'Não foi possível atualizar o status da conta.',
        type: 'error',
      });
    },
  });

  const activeCount = useMemo(() => users.filter((user: any) => user.isActive).length, [users]);

  const openCreateModal = () => {
    setEditingUser(null);
    setFormData({
      nome: '',
      email: '',
      senha: '',
      roles: ['ATTENDANT'],
      role: 'ATTENDANT',
      isActive: true,
      especialidade: '',
      fotoUrl: '',
      commissionRate: '50',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (user: any) => {
    const roles = Array.from(new Set([user.role, ...(user.roles || [])]));
    setEditingUser(user);
    setFormData({
      nome: user.nome,
      email: user.email,
      senha: '',
      roles,
      role: normalizePrimaryRole(roles, user.role),
      isActive: user.isActive !== false,
      especialidade: user.barber?.especialidade || '',
      fotoUrl: user.barber?.fotoUrl || '',
      commissionRate: String(user.barber?.commissionRate ?? 50),
    });
    setIsModalOpen(true);
  };

  const handleRoleToggle = (role: StaffRole) => {
    const nextRoles = formData.roles.includes(role)
      ? formData.roles.filter((item) => item !== role)
      : [...formData.roles, role];
    const normalizedRoles = nextRoles.length > 0 ? nextRoles : [role];

    setFormData({
      ...formData,
      roles: normalizedRoles,
      role: normalizePrimaryRole(normalizedRoles, formData.role),
    });
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!formData.nome || !formData.email) {
      addNotification({
        title: 'Campos obrigatórios',
        description: 'Preencha nome e e-mail para continuar.',
        type: 'warning',
      });
      return;
    }

    if (!editingUser && !formData.senha) {
      addNotification({
        title: 'Senha obrigatória',
        description: 'Defina uma senha inicial para a nova conta.',
        type: 'warning',
      });
      return;
    }

    if (formData.roles.length === 0) {
      addNotification({
        title: 'Permissões obrigatórias',
        description: 'Selecione pelo menos uma função para o usuário.',
        type: 'warning',
      });
      return;
    }

    if (hasProfessionalRole(formData.roles) && !formData.especialidade) {
      addNotification({
        title: 'Especialidade obrigatória',
        description: 'Informe a especialidade para funções profissionais.',
        type: 'warning',
      });
      return;
    }

    const payload = {
      nome: formData.nome,
      email: formData.email,
      senha: formData.senha || undefined,
      role: formData.role,
      roles: formData.roles,
      isActive: formData.isActive,
      especialidade: hasProfessionalRole(formData.roles) ? formData.especialidade : undefined,
      fotoUrl: hasProfessionalRole(formData.roles) ? formData.fotoUrl || undefined : undefined,
      commissionRate: hasProfessionalRole(formData.roles) ? Number(formData.commissionRate || 50) : undefined,
    };

    if (editingUser) {
      updateUserMutation.mutate({ id: editingUser.id, payload });
      return;
    }

    createUserMutation.mutate(payload);
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
        Não foi possível carregar os usuários administrativos no momento.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-zinc-200/85 shadow-sm">
        <div>
          <h3 className="text-sm font-bold text-davinci-black uppercase tracking-wider">Usuários e permissões</h3>
          <p className="text-xs text-davinci-gray mt-1">
            Crie contas, ajuste funções, combine permissões e ative ou desative acessos da equipe.
          </p>
        </div>

        <div className="flex items-center gap-3 text-[11px] font-semibold text-davinci-gray">
          <span>{activeCount} contas ativas</span>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gold-gradient text-davinci-black text-xs font-bold shadow-sm cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Adicionar usuário
          </button>
        </div>
      </div>

      {users.length === 0 ? (
        <div className="bg-white rounded-xl border border-zinc-200/80 p-10 text-center shadow-sm">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-davinci-gold/10 border border-davinci-gold/20 flex items-center justify-center">
            <UserRound className="h-5 w-5 text-davinci-gold" />
          </div>
          <h4 className="text-sm font-bold text-davinci-black">Nenhum usuário cadastrado</h4>
          <p className="text-xs text-davinci-gray mt-2">
            Cadastre contas para recepção, gestão e profissionais com acesso controlado.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {users.map((user: any) => {
            const roleLabels = getRoleLabels(Array.from(new Set([user.role, ...(user.roles || [])])));
            const isMutatingStatus =
              toggleUserStatusMutation.isPending && toggleUserStatusMutation.variables?.id === user.id;

            return (
              <div
                key={user.id}
                className="bg-white rounded-2xl border border-zinc-200/80 p-5 shadow-sm flex flex-col gap-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-bold text-davinci-black">{user.nome}</h4>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                          user.isActive
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-zinc-100 text-zinc-500'
                        }`}
                      >
                        {user.isActive ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                    <p className="text-xs text-davinci-gray mt-1 break-all">{user.email}</p>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => toggleUserStatusMutation.mutate({ id: user.id, isActive: !user.isActive })}
                      disabled={isMutatingStatus}
                      className="p-1.5 rounded text-davinci-gray hover:text-davinci-gold hover:bg-zinc-50 cursor-pointer disabled:opacity-50"
                    >
                      {user.isActive ? <ToggleRight className="h-4.5 w-4.5" /> : <ToggleLeft className="h-4.5 w-4.5" />}
                    </button>
                    <button
                      onClick={() => openEditModal(user)}
                      className="p-1.5 rounded text-davinci-gray hover:text-davinci-gold hover:bg-zinc-50 cursor-pointer"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDeletingUserId(user.id)}
                      className="p-1.5 rounded text-davinci-gray hover:text-red-500 hover:bg-red-50 cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {roleLabels.map((label) => (
                    <span
                      key={label}
                      className="px-2.5 py-1 rounded-full bg-davinci-gold/10 text-davinci-gold text-[10px] font-bold uppercase tracking-wider"
                    >
                      {label}
                    </span>
                  ))}
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex items-start gap-2 text-davinci-gray">
                    <Shield className="h-4 w-4 text-davinci-gold mt-0.5" />
                    <span>Perfil principal: {ROLE_LABELS[user.role as StaffRole] || user.role}</span>
                  </div>

                  {user.barber && (
                    <>
                      <div className="flex items-start gap-2 text-davinci-gray">
                        <BadgeCheck className="h-4 w-4 text-davinci-gold mt-0.5" />
                        <span>{user.barber.especialidade}</span>
                      </div>
                      {user.barber.fotoUrl && (
                        <div className="flex items-start gap-2 text-davinci-gray">
                          <Mail className="h-4 w-4 text-davinci-gold mt-0.5" />
                          <span className="break-all">{user.barber.fotoUrl}</span>
                        </div>
                      )}
                      <div className="flex items-start gap-2 text-davinci-gray">
                        <Shield className="h-4 w-4 text-davinci-gold mt-0.5" />
                        <span>Comissão: {Number(user.barber.commissionRate ?? 50).toFixed(0)}%</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/35 backdrop-blur-sm" onClick={closeModal} />

          <div className="relative z-10 w-full max-w-2xl bg-white rounded-2xl border border-zinc-200 shadow-2xl p-6">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h4 className="text-sm font-bold text-davinci-black">
                  {editingUser ? 'Editar usuário' : 'Novo usuário'}
                </h4>
                <p className="text-xs text-davinci-gray mt-1">
                  Defina acesso, permissões e especialidade profissional quando necessário.
                </p>
              </div>

              <button
                onClick={closeModal}
                className="p-1.5 rounded text-davinci-gray hover:text-davinci-black hover:bg-zinc-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
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
                    E-mail de acesso
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(event) => setFormData({ ...formData, email: event.target.value })}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs focus:outline-none focus:border-davinci-gold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-bold text-davinci-gray mb-1.5">
                    {editingUser ? 'Nova senha (opcional)' : 'Senha inicial'}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-davinci-gray" />
                    <input
                      type="password"
                      value={formData.senha}
                      onChange={(event) => setFormData({ ...formData, senha: event.target.value })}
                      className="w-full pl-9 pr-3 py-2 border border-zinc-200 rounded-lg text-xs focus:outline-none focus:border-davinci-gold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-bold text-davinci-gray mb-1.5">
                    Perfil principal
                  </label>
                  <select
                    value={formData.role}
                    onChange={(event) => {
                      const nextRole = event.target.value as StaffRole;
                      const nextRoles = formData.roles.includes(nextRole)
                        ? formData.roles
                        : [nextRole, ...formData.roles];
                      setFormData({ ...formData, role: nextRole, roles: nextRoles });
                    }}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs focus:outline-none focus:border-davinci-gold"
                  >
                    {formData.roles.map((role) => (
                      <option key={role} value={role}>
                        {ROLE_LABELS[role as StaffRole] || role}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider font-bold text-davinci-gray mb-2">
                  Permissões e funções
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {ROLE_OPTIONS.map((option) => {
                    const checked = formData.roles.includes(option.value);
                    return (
                      <label
                        key={option.value}
                        className={`flex items-center gap-3 rounded-xl border px-3 py-3 cursor-pointer transition-colors ${
                          checked
                            ? 'border-davinci-gold bg-davinci-gold/5'
                            : 'border-zinc-200 hover:border-zinc-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => handleRoleToggle(option.value)}
                          className="rounded border-zinc-300 text-davinci-gold focus:ring-davinci-gold"
                        />
                        <span className="text-xs font-semibold text-davinci-black">{option.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <label className="flex items-center gap-3 rounded-xl border border-zinc-200 px-3 py-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(event) => setFormData({ ...formData, isActive: event.target.checked })}
                  className="rounded border-zinc-300 text-davinci-gold focus:ring-davinci-gold"
                />
                <span className="text-xs font-semibold text-davinci-black">Conta ativa para login</span>
              </label>

              {hasProfessionalRole(formData.roles) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider font-bold text-davinci-gray mb-1.5">
                      Especialidade
                    </label>
                    <textarea
                      rows={3}
                      value={formData.especialidade}
                      onChange={(event) => setFormData({ ...formData, especialidade: event.target.value })}
                      placeholder="Ex: barba clássica, cortes femininos, esmaltação em gel..."
                      className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs resize-none focus:outline-none focus:border-davinci-gold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-wider font-bold text-davinci-gray mb-1.5">
                      URL da foto
                    </label>
                    <input
                      value={formData.fotoUrl}
                      onChange={(event) => setFormData({ ...formData, fotoUrl: event.target.value })}
                      placeholder="https://..."
                      className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs focus:outline-none focus:border-davinci-gold"
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
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 rounded-lg border border-zinc-200 text-xs font-bold text-davinci-gray hover:text-davinci-black"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-gold-gradient text-davinci-black text-xs font-bold shadow-sm"
                >
                  {editingUser ? 'Salvar alterações' : 'Criar usuário'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deletingUserId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/35 backdrop-blur-sm" onClick={() => setDeletingUserId(null)} />

          <div className="relative z-10 w-full max-w-md bg-white rounded-2xl border border-zinc-200 shadow-2xl p-6 space-y-4">
            <div>
              <h4 className="text-sm font-bold text-davinci-black">Excluir usuário</h4>
              <p className="text-xs text-davinci-gray mt-1">
                Essa ação remove a conta e o vínculo profissional relacionado, se existir.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setDeletingUserId(null)}
                className="px-4 py-2 rounded-lg border border-zinc-200 text-xs font-bold text-davinci-gray hover:text-davinci-black"
              >
                Cancelar
              </button>
              <button
                onClick={() => deleteUserMutation.mutate(deletingUserId)}
                className="px-4 py-2 rounded-lg bg-red-500 text-white text-xs font-bold shadow-sm"
              >
                Excluir conta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
