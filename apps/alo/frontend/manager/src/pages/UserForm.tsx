import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { usersService, deliveryMenService } from '../services/users';
import { establishmentsService } from '../services/establishments';
import type { User, CreateUserInput, Establishment } from '../types';

export default function UserForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditing = !!id;

  const { data: user } = useQuery({
    queryKey: ['users', id],
    queryFn: () => usersService.getById(Number(id)),
    enabled: isEditing,
  });

  const { data: establishments } = useQuery({
    queryKey: ['establishments'],
    queryFn: establishmentsService.getAll,
  });

  const mutation = useMutation({
    mutationFn: (data: CreateUserInput) =>
      isEditing
        ? usersService.update(Number(id), data)
        : usersService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      navigate('/users');
    },
  });

  const [formData, setFormData] = useState<CreateUserInput>(
    user || {
      name: '',
      email: '',
      password: '',
      establishment_id: undefined,
    }
  );

  if (isEditing && !user) {
    return <div className="text-center py-12">Loading...</div>;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'establishment_id' ? (value ? Number(value) : undefined) : value,
    }));
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
        {isEditing ? 'Edit User' : 'New User'}
      </h1>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Password {!isEditing && '*'}
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required={!isEditing}
              minLength={6}
              placeholder={isEditing ? 'Leave empty to keep current password' : ''}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Establishment
            </label>
            <select
              name="establishment_id"
              value={formData.establishment_id || ''}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
            >
              <option value="">No establishment</option>
              {establishments?.map((est: Establishment) => (
                <option key={est.id} value={est.id}>
                  {est.name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-sm text-gray-500">
              Assign user to a specific establishment (optional)
            </p>
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={mutation.isPending}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {mutation.isPending ? 'Saving...' : isEditing ? 'Update' : 'Create'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/users')}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
