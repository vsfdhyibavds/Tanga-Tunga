// Profile management utilities

class UserProfileManager {
    constructor() {
        this.currentProfile = null;
    }

    async loadProfile(userId) {
        if (!userId) return null;

        const result = await userAPI.getProfile(userId);
        if (result.success && result.data?.user) {
            this.currentProfile = result.data.user;
            return this.currentProfile;
        }

        return null;
    }

    async loadAndDisplayProfile(userId) {
        const profileContainer = document.getElementById('profileContainer');
        const user = await this.loadProfile(userId);

        if (profileContainer) {
            if (user) {
                this.displayProfile(user);
            } else {
                profileContainer.innerHTML = '<div class="empty-state">Unable to load profile.</div>';
            }
        }

        return user;
    }

    async updateProfile(userData) {
        const result = await userAPI.updateProfile(userData);
        return result;
    }

    async changePassword(currentPassword, newPassword) {
        const result = await userAPI.changePassword(currentPassword, newPassword);
        return result;
    }

    async getAttendanceRecord(userId) {
        const result = await userAPI.getAttendance(userId);
        if (result.success) {
            return result.data.attendanceRecord;
        }
        return [];
    }

    async getDashboardStats() {
        const result = await userAPI.getDashboardStats();
        if (result.success) {
            return result.data.stats;
        }
        return null;
    }

    async deactivateAccount() {
        const result = await userAPI.deactivateAccount();
        return result;
    }

    displayProfile(user) {
        const profileContainer = document.getElementById('profileContainer');
        if (!profileContainer) return;

        profileContainer.innerHTML = '';

        const card = document.createElement('div');
        card.className = 'profile-card';

        const header = document.createElement('div');
        header.className = 'profile-header';

        const avatar = document.createElement('div');
        avatar.className = 'profile-avatar';
        avatar.textContent = user.firstName?.charAt(0).toUpperCase() || '?';
        header.appendChild(avatar);

        const info = document.createElement('div');
        info.className = 'profile-info';

        const name = document.createElement('h2');
        name.textContent = `${user.firstName || ''} ${user.lastName || ''}`;
        info.appendChild(name);

        const email = document.createElement('p');
        email.className = 'profile-email';
        email.textContent = user.email || '';
        info.appendChild(email);

        const role = document.createElement('p');
        role.className = 'profile-role';
        role.textContent = user.role?.toUpperCase() || '';
        info.appendChild(role);

        header.appendChild(info);
        card.appendChild(header);

        const details = document.createElement('div');
        details.className = 'profile-details';
        details.innerHTML = `
            <p><strong>Student/Staff ID:</strong> ${escapeHtml(user.studentId || 'N/A')}</p>
            <p><strong>Department:</strong> ${escapeHtml(user.department || 'N/A')}</p>
            <p><strong>Phone:</strong> ${escapeHtml(user.phone || 'Not provided')}</p>
            <p><strong>Bio:</strong> ${escapeHtml(user.bio || 'No bio provided')}</p>
        `;
        card.appendChild(details);

        if (user.stats) {
            const statsRow = document.createElement('div');
            statsRow.className = 'profile-stats';
            statsRow.innerHTML = `
                <div class="profile-stat">
                    <span class="profile-stat-value">${user.stats.registeredEvents || 0}</span>
                    <span>Registered</span>
                </div>
                <div class="profile-stat">
                    <span class="profile-stat-value">${user.stats.attendedEvents || 0}</span>
                    <span>Attended</span>
                </div>
                <div class="profile-stat">
                    <span class="profile-stat-value">${user.stats.certificates || 0}</span>
                    <span>Certificates</span>
                </div>
            `;
            card.appendChild(statsRow);
        }

        const actions = document.createElement('div');
        actions.className = 'profile-actions';

        const editButton = document.createElement('button');
        editButton.className = 'btn btn-primary';
        editButton.type = 'button';
        editButton.textContent = 'Edit Profile';
        editButton.addEventListener('click', () => this.showEditProfile());
        actions.appendChild(editButton);

        const changePasswordButton = document.createElement('button');
        changePasswordButton.className = 'btn btn-secondary';
        changePasswordButton.type = 'button';
        changePasswordButton.textContent = 'Change Password';
        changePasswordButton.addEventListener('click', () => this.showChangePassword());
        actions.appendChild(changePasswordButton);

        const deactivateButton = document.createElement('button');
        deactivateButton.className = 'btn btn-danger';
        deactivateButton.type = 'button';
        deactivateButton.textContent = 'Deactivate Account';
        deactivateButton.addEventListener('click', () => this.confirmDeactivate());
        actions.appendChild(deactivateButton);

        card.appendChild(actions);
        profileContainer.appendChild(card);
    }

    async showEditProfile() {
        const user = this.currentProfile || currentUser;
        if (!user) {
            showNotification('Error', 'Unable to load profile data.', 'error');
            return;
        }

        const modal = document.getElementById('profileModal');
        if (!modal) return;

        document.getElementById('profileModalTitle').textContent = 'Edit Profile';
        document.getElementById('profileModalBody').innerHTML = `
            <form id="profileEditForm" class="modal-form">
                <div class="form-group">
                    <label>First Name</label>
                    <input type="text" name="firstName" value="${escapeHtml(user.firstName || '')}" required>
                </div>
                <div class="form-group">
                    <label>Last Name</label>
                    <input type="text" name="lastName" value="${escapeHtml(user.lastName || '')}" required>
                </div>
                <div class="form-group">
                    <label>Department</label>
                    <input type="text" name="department" value="${escapeHtml(user.department || '')}">
                </div>
                <div class="form-group">
                    <label>Phone</label>
                    <input type="text" name="phone" value="${escapeHtml(user.phone || '')}">
                </div>
                <div class="form-group">
                    <label>Bio</label>
                    <textarea name="bio" rows="4">${escapeHtml(user.bio || '')}</textarea>
                </div>
                <button type="submit" class="btn btn-primary">Save Changes</button>
            </form>
        `;

        const form = document.getElementById('profileEditForm');
        if (form) {
            form.addEventListener('submit', (event) => this.handleProfileUpdate(event));
        }

        modal.classList.add('active');
    }

    async showChangePassword() {
        const modal = document.getElementById('profileModal');
        if (!modal) return;

        document.getElementById('profileModalTitle').textContent = 'Change Password';
        document.getElementById('profileModalBody').innerHTML = `
            <form id="changePasswordForm" class="modal-form">
                <div class="form-group">
                    <label>Current Password</label>
                    <input type="password" name="currentPassword" required>
                </div>
                <div class="form-group">
                    <label>New Password</label>
                    <input type="password" name="newPassword" required>
                </div>
                <div class="form-group">
                    <label>Confirm New Password</label>
                    <input type="password" name="confirmPassword" required>
                </div>
                <button type="submit" class="btn btn-primary">Update Password</button>
            </form>
        `;

        const form = document.getElementById('changePasswordForm');
        if (form) {
            form.addEventListener('submit', (event) => this.handlePasswordChange(event));
        }

        modal.classList.add('active');
    }

    async handleProfileUpdate(event) {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);

        const userData = {
            firstName: formData.get('firstName')?.toString().trim(),
            lastName: formData.get('lastName')?.toString().trim(),
            department: formData.get('department')?.toString().trim(),
            phone: formData.get('phone')?.toString().trim(),
            bio: formData.get('bio')?.toString().trim()
        };

        const result = await this.updateProfile(userData);
        if (result.success) {
            const updatedUser = {
                ...this.currentProfile,
                ...result.data.user,
                stats: this.currentProfile?.stats
            };
            this.currentProfile = updatedUser;
            if (typeof currentUser !== 'undefined') {
                currentUser = { ...currentUser, ...result.data.user };
                sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
            }

            this.displayProfile(updatedUser);
            document.getElementById('profileModal').classList.remove('active');
            showNotification('Success', result.message || 'Profile updated successfully');
        } else {
            showNotification('Error', result.error || 'Failed to update profile', 'error');
        }
    }

    async handlePasswordChange(event) {
        event.preventDefault();
        const form = event.target;
        const currentPassword = form.currentPassword.value;
        const newPassword = form.newPassword.value;
        const confirmPassword = form.confirmPassword.value;

        if (newPassword !== confirmPassword) {
            showNotification('Error', 'New passwords do not match', 'error');
            return;
        }

        const result = await this.changePassword(currentPassword, newPassword);
        if (result.success) {
            document.getElementById('profileModal').classList.remove('active');
            showNotification('Success', result.message || 'Password changed successfully');
            form.reset();
        } else {
            showNotification('Error', result.error || 'Failed to change password', 'error');
        }
    }

    async confirmDeactivate() {
        const confirmed = window.confirm('Are you sure you want to deactivate your account? This action cannot be undone.');
        if (!confirmed) return;

        const result = await this.deactivateAccount();
        if (result.success) {
            showNotification('Success', 'Account deactivated.', 'success');
            logout();
        } else {
            showNotification('Error', result.error || 'Failed to deactivate account.', 'error');
        }
    }
}

const profileManager = new UserProfileManager();
