import React, { useState } from 'react';
import {
  User as UserIcon,
  Lock,
  Tag,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store';
import { updateProfile } from '../store/authSlice';
import { deleteCategory } from '../store/financeSlice';
import { authApi } from '../api/authApi';
import { Category } from '../types';
import { CategoryModal } from '../components/modals/CategoryModal';
import { ConfirmDialog } from '../components/modals/ConfirmDialog';

export const SettingsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const categories = useAppSelector((state) => state.finance.categories);

  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'categories'>('profile');

  // Profile Form State
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Category State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteTargetCategory, setDeleteTargetCategory] = useState<Category | null>(null);
  const [categoryError, setCategoryError] = useState('');

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccess('');
    setProfileError('');
    setProfileLoading(true);

    try {
      await dispatch(updateProfile({ name: name.trim(), email: email.trim() })).unwrap();
      setProfileSuccess('Profile updated successfully!');
    } catch (err: any) {
      setProfileError(typeof err === 'string' ? err : 'Failed to update profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSuccess('');
    setPasswordError('');

    if (newPassword !== confirmNewPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long');
      return;
    }

    setPasswordLoading(true);
    try {
      await authApi.changePassword({ currentPassword, newPassword });
      setPasswordSuccess('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err: any) {
      setPasswordError(err.response?.data?.error || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleDeleteCategoryConfirm = async () => {
    if (!deleteTargetCategory) return;
    setCategoryError('');
    try {
      await dispatch(deleteCategory(deleteTargetCategory.id)).unwrap();
      setDeleteTargetCategory(null);
    } catch (err: any) {
      setCategoryError(typeof err === 'string' ? err : 'Cannot delete category with transactions.');
      setDeleteTargetCategory(null);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Settings</h1>
        <p className="text-xs text-slate-400 mt-0.5">Manage your profile, password, and custom categories.</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === 'profile'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <UserIcon className="w-4 h-4" />
          Profile Details
        </button>

        <button
          onClick={() => setActiveTab('password')}
          className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === 'password'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Lock className="w-4 h-4" />
          Password & Security
        </button>

        <button
          onClick={() => setActiveTab('categories')}
          className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === 'categories'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Tag className="w-4 h-4" />
          Manage Categories ({categories.length})
        </button>
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="bg-slate-900/90 rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-sm">
          <h2 className="text-base font-bold text-white mb-1">Personal Information</h2>
          <p className="text-xs text-slate-400 mb-6">Update your account name and email address.</p>

          {profileSuccess && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 text-xs font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              {profileSuccess}
            </div>
          )}

          {profileError && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/20 text-rose-400 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              {profileError}
            </div>
          )}

          <form onSubmit={handleProfileSubmit} className="space-y-4 max-w-lg">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-800/80 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-sm text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-800/80 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-sm text-white"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={profileLoading}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-xs transition-colors cursor-pointer"
              >
                {profileLoading ? 'Saving...' : 'Save Profile Changes'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Password Tab */}
      {activeTab === 'password' && (
        <div className="bg-slate-900/90 rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-sm">
          <h2 className="text-base font-bold text-white mb-1">Change Password</h2>
          <p className="text-xs text-slate-400 mb-6">Ensure your account uses a strong 8+ character password.</p>

          {passwordSuccess && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 text-xs font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              {passwordSuccess}
            </div>
          )}

          {passwordError && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/20 text-rose-400 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              {passwordError}
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-lg">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Current Password</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-800/80 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-sm text-white placeholder-slate-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">New Password</label>
              <input
                type="password"
                required
                placeholder="At least 8 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-800/80 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-sm text-white placeholder-slate-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Confirm New Password</label>
              <input
                type="password"
                required
                placeholder="Re-type new password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-800/80 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-sm text-white placeholder-slate-500"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={passwordLoading}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-xs transition-colors cursor-pointer"
              >
                {passwordLoading ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Categories Tab */}
      {activeTab === 'categories' && (
        <div className="bg-slate-900/90 rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-white">Categories</h2>
              <p className="text-xs text-slate-400">Custom categories to classify transactions and budgets.</p>
            </div>
            <button
              onClick={() => {
                setEditingCategory(null);
                setIsCategoryModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Category
            </button>
          </div>

          {categoryError && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/20 text-rose-400 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              {categoryError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 hover:bg-slate-800/40 flex items-center justify-between transition-colors shadow-2xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className="w-3.5 h-3.5 rounded-full shrink-0"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="font-semibold text-xs text-slate-200 truncate">{cat.name}</span>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => {
                      setEditingCategory(cat);
                      setIsCategoryModalOpen(true);
                    }}
                    className="p-1.5 rounded-md text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Edit Category"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeleteTargetCategory(cat)}
                    className="p-1.5 rounded-md text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Delete Category"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        categoryToEdit={editingCategory}
      />

      <ConfirmDialog
        isOpen={!!deleteTargetCategory}
        title="Delete Category"
        message={`Are you sure you want to delete the "${deleteTargetCategory?.name}" category? (If this category has existing transactions, deletion will be safely rejected).`}
        confirmLabel="Delete"
        onConfirm={handleDeleteCategoryConfirm}
        onCancel={() => setDeleteTargetCategory(null)}
      />
    </div>
  );
};
