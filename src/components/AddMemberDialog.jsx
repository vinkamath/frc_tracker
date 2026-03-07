import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, getDocs, query, where, doc, updateDoc } from 'firebase/firestore';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const normalizePhone = (phone) => phone.replace(/\D/g, '');

const formatPhoneDisplay = (phone) => {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.length === 10) return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  if (digits.length === 11 && digits.startsWith('1')) return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  return phone || '';
};

function AddMemberDialog({ open, onOpenChange, onSuccess, member: editMember, offerCheckInToday = false }) {
  const isEdit = !!editMember;
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [checkInForToday, setCheckInForToday] = useState(true);

  useEffect(() => {
    if (open) {
      if (editMember) {
        setName(editMember.name || '');
        setPhone(editMember.phone ? formatPhoneDisplay(editMember.phone) : '');
      } else {
        setName('');
        setPhone('');
        setCheckInForToday(true);
      }
    }
  }, [open, editMember]);

  const resetForm = () => {
    setName('');
    setPhone('');
  };

  const handleOpenChange = (isOpen) => {
    if (!isOpen) resetForm();
    onOpenChange(isOpen);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Please enter a member name');
      return;
    }
    if (!phone.trim()) {
      alert('Please enter a phone number');
      return;
    }

    const normalizedPhone = normalizePhone(phone.trim());
    if (normalizedPhone.length < 10) {
      alert('Please enter a valid phone number (at least 10 digits)');
      return;
    }

    try {
      const existingQuery = query(
        collection(db, 'members'),
        where('phone', '==', normalizedPhone)
      );
      const existingSnapshot = await getDocs(existingQuery);
      const conflictingDoc = existingSnapshot.docs.find(d => !isEdit || d.id !== editMember.id);
      if (conflictingDoc) {
        const existingMember = conflictingDoc.data();
        alert(`This phone number is already registered to ${existingMember.name}. Please use a different number or contact the admin.`);
        return;
      }

      if (isEdit) {
        await updateDoc(doc(db, 'members', editMember.id), {
          name: name.trim(),
          phone: normalizedPhone
        });
        resetForm();
        handleOpenChange(false);
        onSuccess?.();
      } else {
        const docRef = await addDoc(collection(db, 'members'), {
          name: name.trim(),
          phone: normalizedPhone,
          joinedDate: format(new Date(), 'yyyy-MM-dd'),
          createdAt: new Date().toISOString()
        });
        resetForm();
        handleOpenChange(false);
        onSuccess?.(docRef.id, offerCheckInToday ? { checkInForToday } : undefined);
      }
    } catch (error) {
      console.error(isEdit ? 'Error updating member:' : 'Error adding member:', error);
      alert(isEdit ? 'Error updating member. Please try again.' : 'Error adding member. Please try again.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Member' : 'Add New Member'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update the member\'s name and phone number.'
              : 'Enter the name and phone number of the new member to add to the run club.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="add-member-name">Member Name</Label>
            <Input
              id="add-member-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter member name"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="add-member-phone">Phone Number</Label>
            <Input
              id="add-member-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(555) 123-4567"
            />
          </div>
          {offerCheckInToday && !isEdit && (
            <div className="flex items-center gap-2">
              <input
                id="add-member-check-in-today"
                type="checkbox"
                checked={checkInForToday}
                onChange={(e) => setCheckInForToday(e.target.checked)}
                className="h-4 w-4 rounded border-input accent-primary"
              />
              <Label htmlFor="add-member-check-in-today" className="font-normal cursor-pointer">
                Also check me in for today
              </Label>
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{isEdit ? 'Save Changes' : 'Add Member'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default AddMemberDialog;
