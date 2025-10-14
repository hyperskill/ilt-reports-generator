'use client';

import { useState } from 'react';
import { Box, Button, Flex, Text, TextField } from '@radix-ui/themes';
import styles from './ChangePasswordForm.module.css';

export default function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('All fields are required');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long');
      return;
    }

    if (currentPassword === newPassword) {
      setError('New password must be different from current password');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/users/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to change password');
      }

      setSuccess('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.message || 'An error occurred while changing password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <Flex direction="column" gap="3">
        <Box>
          <Text as="label" size="2" weight="bold" mb="1">
            Current Password
          </Text>
          <TextField.Root
            type="password"
            placeholder="Enter current password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            disabled={loading}
          />
        </Box>

        <Box>
          <Text as="label" size="2" weight="bold" mb="1">
            New Password
          </Text>
          <TextField.Root
            type="password"
            placeholder="Enter new password (min 6 characters)"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            disabled={loading}
          />
        </Box>

        <Box>
          <Text as="label" size="2" weight="bold" mb="1">
            Confirm New Password
          </Text>
          <TextField.Root
            type="password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={loading}
          />
        </Box>

        {error && (
          <Box className={styles.errorMessage}>
            <Text size="2" color="red">{error}</Text>
          </Box>
        )}

        {success && (
          <Box className={styles.successMessage}>
            <Text size="2" color="green" weight="bold">{success}</Text>
          </Box>
        )}

        <Button type="submit" disabled={loading} size="3">
          {loading ? 'Changing Password...' : 'Change Password'}
        </Button>
      </Flex>
    </form>
  );
}

