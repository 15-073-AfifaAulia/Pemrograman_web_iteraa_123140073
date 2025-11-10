import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom'; 
// Import eksplisit semua API Vitest untuk menghindari ReferenceError
import { describe, it, expect, vi, beforeEach } from 'vitest'; 

// Perbaikan Impor: Jalur relatif sudah benar (dari src/__tests__ ke src/App.jsx)
import App from '../App.jsx'; 

// MOCKING: Simulasi localStorage untuk Unit Testing
const mockLocalStorage = (() => {
    let store = {};
    return {
        getItem: (key) => store[key] || null,
        setItem: (key, value) => { store[key] = value.toString(); },
        clear: () => { store = {}; },
        removeItem: (key) => { delete store[key]; }
    };
})();
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });


// PENGUJIAN 5 KRITERIA WAJIB

describe('Aplikasi Manajemen Buku Pribadi', () => {
    
    beforeEach(() => {
        localStorage.clear();
        vi.spyOn(window.localStorage, 'setItem'); 
    });
    
    // Uji #1: Menambah dan Menampilkan Buku
    it('1. Dapat menambah buku baru dan menampilkannya di daftar', async () => {
        render(<App />);
        
        // Simulasikan input form
        const titleInput = screen.getByPlaceholderText(/Judul Buku/i);
        const authorInput = screen.getByPlaceholderText(/Penulis/i);
        const addButton = screen.getByText(/Tambahkan Buku/i);

        fireEvent.change(titleInput, { target: { value: 'Filosofi Teras' } });
        fireEvent.change(authorInput, { target: { value: 'Henry Manampiring' } });
        
        fireEvent.click(addButton);

        // Ekspektasi: Buku baru muncul di dokumen
        await waitFor(() => {
            expect(screen.getByText(/Filosofi Teras/i)).toBeInTheDocument();
            expect(screen.getByText(/Oleh: Henry Manampiring/i)).toBeInTheDocument();
        });

        // Memastikan data disimpan
        expect(window.localStorage.setItem).toHaveBeenCalled();
    });

    // Uji #2: Error Handling Input Wajib
    it('2. Menampilkan error jika Judul atau Penulis kosong saat submit', async () => {
        render(<App />);

        const titleInput = screen.getByPlaceholderText(/Judul Buku/i);
        const addButton = screen.getByText(/Tambahkan Buku/i);

        fireEvent.change(titleInput, { target: { value: '' } });
        fireEvent.click(addButton);

        // Ekspektasi: Pesan error tampil
        await waitFor(() => {
            expect(screen.getByText(/Judul dan Penulis tidak boleh kosong/i)).toBeInTheDocument();
        });
    });
    
    // Uji #3 & #4: Pencarian dan Filter
    it('3. dan 4. Dapat memfilter berdasarkan status dan mencari berdasarkan teks', async () => {
        // Setup data awal
        const initialBooks = [
            { id: '1', title: 'The Witcher: Blood of Elves', author: 'Andrzej Sapkowski', status: 'baca' },
            { id: '2', title: 'Dune', author: 'Frank Herbert', status: 'milik' },
            { id: '3', title: 'The Lord of The Rings', author: 'J.R.R. Tolkien', status: 'beli' },
        ];
        localStorage.setItem('personalBookList', JSON.stringify(initialBooks));
        
        render(<App />);
        
        // A. Uji Filter Status ("baca")
        const filterDropdown = screen.getByText(/Semua Status/i).closest('select'); 
        fireEvent.change(filterDropdown, { target: { value: 'baca' } });
        
        await waitFor(() => {
            expect(screen.getByText(/The Witcher/i)).toBeInTheDocument();
            expect(screen.queryByText('Dune')).not.toBeInTheDocument(); 
        });

        // B. Uji Pencarian Teks (Mencari "Tolkien")
        fireEvent.change(filterDropdown, { target: { value: 'all' } }); 
        const searchInput = screen.getByPlaceholderText(/Cari Judul atau Penulis/i);
        
        fireEvent.change(searchInput, { target: { value: 'Tolkien' } });
        
        await waitFor(() => {
            expect(screen.getByText(/The Lord of The Rings/i)).toBeInTheDocument();
            expect(screen.queryByText('Dune')).not.toBeInTheDocument();
        });
    });

    // Uji #5: Perhitungan Statistik (Custom Hook useBookStats)
    it('5. Halaman Statistik menampilkan perhitungan buku yang akurat', async () => {
        // Setup data 
        const statsBooks = [
            { id: 'a', title: 'Milik 1', author: 'A', status: 'milik' },
            { id: 'b', title: 'Milik 2', author: 'B', status: 'milik' },
            { id: 'c', title: 'Baca 1', author: 'C', status: 'baca' },
            { id: 'd', title: 'Beli 1', author: 'D', status: 'beli' },
        ];
        localStorage.setItem('personalBookList', JSON.stringify(statsBooks));
        
        render(<App />);
        
        // Pindah ke halaman Statistik
        const statsButton = screen.getByRole('button', { name: /Statistik/i });
        fireEvent.click(statsButton);
        
        // Ekspektasi: Memeriksa nilai total dan status spesifik
        await waitFor(() => {
            // Total Buku (Harus 4)
            expect(screen.getByText('Total Buku')).toBeInTheDocument();
            expect(screen.getByText('4')).toBeInTheDocument(); 

            // Milik (Owned) (Harus 2)
            expect(screen.getByText('Milik (Owned)')).toBeInTheDocument();
            expect(screen.getByText('2')).toBeInTheDocument(); 

            // Sedang Dibaca (Harus 1)
            expect(screen.getByText('Sedang Dibaca')).toBeInTheDocument();
            const readingValue = screen.getAllByText('1')[0]; 
            expect(readingValue).toBeInTheDocument();
        });
    });
});