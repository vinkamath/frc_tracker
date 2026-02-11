import { useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
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

function AddMemberDialog({ open, onOpenChange, onSuccess }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

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
      if (!existingSnapshot.empty) {
        const existingMember = existingSnapshot.docs[0].data();
        alert(`This phone number is already registered to ${existingMember.name}. Please use a different number or contact the admin.`);
        return;
      }

      const docRef = await addDoc(collection(db, 'members'), {
        name: name.trim(),
        phone: normalizedPhone,
        joinedDate: format(new Date(), 'yyyy-MM-dd'),
        createdAt: new Date().toISOString()
      });

      resetForm();
      handleOpenChange(false);
      onSuccess?.(docRef.id);
    } catch (error) {
      console.error('Error adding member:', error);
      alert('Error adding member. Please try again.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Member</DialogTitle>
          <DialogDescription>
            Enter the name and phone number of the new member to add to the run club.
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
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Member</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default AddMemberDialog;
