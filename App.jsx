import React, { useState, useEffect, useContext, createContext, useMemo } from 'react';

// A. CUSTOM HOOKS

/**
 * Custom Hook: useLocalStorage
 */
const useLocalStorage = (key, initialValue) => {
    const getStoredValue = () => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.error("Error reading localStorage key “" + key + "”:", error);
            return initialValue;
        }
    };

    const [value, setValue] = useState(getStoredValue);

    useEffect(() => {
        try {
            window.localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.error("Error setting localStorage key “" + key + "”:", error);
        }
    }, [key, value]);

    return [value, setValue];
};

/**
 * Custom Hook: useBookStats
 */
const useBookStats = (books) => {
    return useMemo(() => {
        const total = books.length;
        const milik = books.filter(b => b.status === 'milik').length;
        const baca = books.filter(b => b.status === 'baca').length;
        const beli = books.filter(b => b.status === 'beli').length;

        return { total, milik, baca, beli };
    }, [books]);
};


// B. CONTEXT API

const BookContext = createContext();

const BookProvider = ({ children }) => {
    const [books, setBooks] = useLocalStorage('personalBookList', []);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    const generateId = () => Date.now().toString(36) + Math.random().toString(36).substring(2);

    const addBook = (book) => {
        const newBook = { ...book, id: generateId() };
        setBooks((prev) => [...prev, newBook]);
    };

    const updateBook = (updatedBook) => {
        setBooks((prev) =>
            prev.map((book) => (book.id === updatedBook.id ? updatedBook : book))
        );
    };

    const deleteBook = (id) => {
        setBooks((prev) => prev.filter((book) => book.id !== id));
    };

    const value = {
        books,
        addBook,
        updateBook,
        deleteBook,
        searchTerm,
        setSearchTerm,
        filterStatus,
        setFilterStatus,
    };

    return <BookContext.Provider value={value}>{children}</BookContext.Provider>;
};

const useBooks = () => useContext(BookContext);


// C. KOMPONEN REUSABLE 

const inputStyle = { padding: '10px', margin: '5px 0', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box', width: '100%', color: '#fff' };
const containerStyle = { marginBottom: '20px', padding: '20px', backgroundColor: '#333', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' };

/**
 * BookForm - Komponen untuk menambah/mengedit buku
 */
const BookForm = ({ bookToEdit, onComplete }) => {
    const { addBook, updateBook } = useBooks();
    const isEditing = !!bookToEdit;

    const [title, setTitle] = useState(bookToEdit?.title || '');
    const [author, setAuthor] = useState(bookToEdit?.author || '');
    const [status, setStatus] = useState(bookToEdit?.status || 'milik');
    const [error, setError] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');

        if (!title.trim() || !author.trim()) {
            setError('Judul dan Penulis tidak boleh kosong.');
            return;
        }

        const bookData = { title: title.trim(), author: author.trim(), status };

        if (isEditing) {
            updateBook({ ...bookData, id: bookToEdit.id });
        } else {
            addBook(bookData);
        }

        setTitle('');
        setAuthor('');
        setStatus('milik');
        onComplete();
    };

    return (
        <form onSubmit={handleSubmit} style={{...containerStyle, backgroundColor: isEditing ? '#444' : '#333'}}>
            <h2 style={{ fontSize: '1.5em', marginBottom: '15px', color: '#fff' }}>
                {isEditing ? 'Edit Buku' : 'Tambah Buku Baru'}
            </h2>

            {error && (
                <p style={{ padding: '10px', marginBottom: '15px', backgroundColor: '#fdd', color: '#800', border: '1px solid #f00', borderRadius: '4px' }}>
                    ⚠️ {error}
                </p>
            )}

            <input
                type="text"
                placeholder="Judul Buku"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{...inputStyle, backgroundColor: '#444', borderColor: '#666'}}
            />
            <input
                type="text"
                placeholder="Penulis"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                style={{...inputStyle, backgroundColor: '#444', borderColor: '#666'}}
            />
            <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                style={{...inputStyle, backgroundColor: '#444', color: '#fff', borderColor: '#666'}}
            >
                <option value="milik">Milik (Owned)</option>
                <option value="baca">Sedang Dibaca (Reading)</option>
                <option value="beli">Ingin Dibeli (Wishlist)</option>
            </select>
            <button
                type="submit"
                style={{...inputStyle, marginTop: '10px', backgroundColor: isEditing ? '#f80' : '#07f', color: '#fff', border: 'none'}}
            >
                {isEditing ? 'Simpan Perubahan' : 'Tambahkan Buku'}
            </button>
        </form>
    );
};

/**
 * BookItem - Menampilkan detail satu buku
 */
const BookItem = ({ book, onEdit }) => {
    const { deleteBook } = useBooks();

    const getStatusStyle = (status) => {
        switch (status) {
            case 'milik': return { backgroundColor: '#5c5', color: '#000' };
            case 'baca': return { backgroundColor: '#fa5', color: '#000' };
            case 'beli': return { backgroundColor: '#69f', color: '#000' };
            default: return { backgroundColor: '#aaa', color: '#000' };
        }
    };

    return (
        <div style={{...containerStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#444'}}>
            <div style={{textAlign: 'left'}}>
                <p style={{ fontSize: '1.2em', fontWeight: 'bold', margin: '0', color: '#fff' }}>{book.title}</p>
                <p style={{ fontSize: '0.9em', margin: '5px 0', color: '#aaa' }}>Oleh: {book.author}</p>
                <span style={{...getStatusStyle(book.status), padding: '4px 8px', borderRadius: '12px', fontSize: '0.8em', display: 'inline-block'}}>
                    {book.status === 'milik' ? 'Milik' : book.status === 'baca' ? 'Dibaca' : 'Ingin Beli'}
                </span>
            </div>
            <div style={{display: 'flex', gap: '10px'}}>
                <button
                    onClick={() => onEdit(book)}
                    style={{padding: '8px', backgroundColor: '#07f'}}
                    title="Edit Buku"
                >
                    Edit
                </button>
                <button
                    onClick={() => deleteBook(book.id)}
                    style={{padding: '8px', backgroundColor: '#f33'}}
                    title="Hapus Buku"
                >
                    Hapus
                </button>
            </div>
        </div>
    );
};

/**
 * BookFilterSearch - Input filter dan pencarian
 */
const BookFilterSearch = () => {
    const { searchTerm, setSearchTerm, filterStatus, setFilterStatus } = useBooks();

    return (
        <div style={{...containerStyle, display: 'flex', gap: '10px', backgroundColor: '#333'}}>
            <input
                type="text"
                placeholder="Cari Judul atau Penulis..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{...inputStyle, flex: 1, margin: 0, backgroundColor: '#444', color: '#fff'}}
            />
            <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                style={{...inputStyle, width: 'auto', margin: 0, backgroundColor: '#444', color: '#fff'}}
            >
                <option value="all">Semua Status</option>
                <option value="milik">Milik</option>
                <option value="baca">Sedang Dibaca</option>
                <option value="beli">Ingin Dibeli</option>
            </select>
        </div>
    );
};

/**
 * BookList - Komponen daftar buku
 */
const BookList = ({ onEdit }) => {
    const { books, searchTerm, filterStatus } = useBooks();

    const filteredBooks = useMemo(() => {
        return books
            .filter((book) => {
                const statusMatch = filterStatus === 'all' || book.status === filterStatus;
                const searchMatch = book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                    book.author.toLowerCase().includes(searchTerm.toLowerCase());
                return statusMatch && searchMatch;
            })
            .sort((a, b) => a.title.localeCompare(b.title));
    }, [books, searchTerm, filterStatus]);

    if (filteredBooks.length === 0) {
        return (
            <div style={{padding: '30px', backgroundColor: '#444', borderRadius: '8px', color: '#aaa'}}>
                <p style={{fontSize: '1.2em', margin: 0}}>Tidak ada buku yang ditemukan.</p>
                <p style={{fontSize: '0.9em', marginTop: '5px'}}>Coba sesuaikan filter atau tambahkan buku baru.</p>
            </div>
        );
    }

    return (
        <div style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
            {filteredBooks.map((book) => (
                <BookItem key={book.id} book={book} onEdit={onEdit} />
            ))}
        </div>
    );
};



// D. HALAMAN & NAVIGASI

/**
 * HomePage - Halaman utama untuk manajemen buku
 */
const HomePage = () => {
    const [editingBook, setEditingBook] = useState(null);
    const handleEditComplete = () => setEditingBook(null);

    return (
        <div style={{width: '100%', maxWidth: '800px', margin: '0 auto'}}>
            <BookForm
                bookToEdit={editingBook}
                onComplete={handleEditComplete}
            />

            <h2 style={{fontSize: '2em', fontWeight: 'bold', margin: '30px 0 15px 0', color: '#fff'}}>Daftar Koleksi Buku</h2>
            <BookFilterSearch />

            <BookList onEdit={setEditingBook} />
        </div>
    );
};

/**
 * StatsPage - Halaman statistik buku
 */
const StatsPage = () => {
    const { books } = useBooks();
    const stats = useBookStats(books);

    const dataCards = [
        { label: 'Total Buku', value: stats.total, color: '#07f' },
        { label: 'Milik (Owned)', value: stats.milik, color: '#5c5' },
        { label: 'Sedang Dibaca', value: stats.baca, color: '#fa5' },
        { label: 'Ingin Dibeli (Wishlist)', value: stats.beli, color: '#69f' },
    ];

    return (
        <div style={{...containerStyle, backgroundColor: '#333', textAlign: 'left', margin: '0 auto'}}>
            <h1 style={{ fontSize: '2em', color: '#fff', borderBottom: '1px solid #555', paddingBottom: '10px', marginBottom: '20px' }}>Ringkasan Koleksi</h1>
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px'}}>
                {dataCards.map((card) => (
                    <div key={card.label} style={{padding: '15px', borderRadius: '8px', color: '#000', backgroundColor: card.color, boxShadow: '0 2px 4px rgba(0,0,0,0.2)'}}>
                        <p style={{fontSize: '0.8em', margin: 0, fontWeight: 'bold', opacity: 0.8}}>{card.label.toUpperCase()}</p>
                        <p style={{fontSize: '2.5em', fontWeight: 'bold', margin: '5px 0 0 0'}}>{card.value}</p>
                    </div>
                ))}
            </div>

            {/* Visualisasi Sederhana */}
            {stats.total > 0 && (
                <div style={{marginTop: '30px'}}>
                    <h2 style={{fontSize: '1.2em', color: '#ccc', marginBottom: '10px'}}>Distribusi Status Buku</h2>
                    <div style={{display: 'flex', borderRadius: '6px', overflow: 'hidden', height: '24px', fontSize: '0.7em', fontWeight: 'bold', color: '#000', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.3)'}}>
                        {stats.milik > 0 && (
                            <div
                                style={{ width: `${(stats.milik / stats.total) * 100}%`, backgroundColor: '#5c5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                title={`Milik: ${stats.milik}`}
                            >
                                {`${Math.round((stats.milik / stats.total) * 100)}%`}
                            </div>
                        )}
                        {stats.baca > 0 && (
                            <div
                                style={{ width: `${(stats.baca / stats.total) * 100}%`, backgroundColor: '#fa5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                title={`Dibaca: ${stats.baca}`}
                            >
                                {`${Math.round((stats.baca / stats.total) * 100)}%`}
                            </div>
                        )}
                        {stats.beli > 0 && (
                            <div
                                style={{ width: `${(stats.beli / stats.total) * 100}%`, backgroundColor: '#69f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                title={`Ingin Beli: ${stats.beli}`}
                            >
                                {`${Math.round((stats.beli / stats.total) * 100)}%`}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};


// E. APLIKASI UTAMA (App.jsx)

const App = () => {
    const [currentPage, setCurrentPage] = useState('home');

    const renderPage = () => {
        switch (currentPage) {
            case 'home':
                return <HomePage />;
            case 'stats':
                return <StatsPage />;
            default:
                return <HomePage />;
        }
    };

    const NavButton = ({ page, label }) => (
        <button
            onClick={() => setCurrentPage(page)}
            style={{padding: '10px 15px', marginRight: '5px', backgroundColor: currentPage === page ? '#fff' : 'transparent', color: currentPage === page ? '#242424' : '#fff', border: 'none', borderRadius: '4px'}}
        >
            {label}
        </button>
    );

    return (
        <BookProvider>
            <div style={{minHeight: '100vh', backgroundColor: '#242424', padding: '0 20px'}}>
                {/* Header/Navigasi */}
                <header style={{backgroundColor: '#1a1a1a', padding: '15px 0', borderBottom: '1px solid #444', marginBottom: '30px'}}>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '800px', margin: '0 auto'}}>
                        <h1 style={{fontSize: '1.5em', color: '#fff', margin: 0}}>
                            📚 Book Manager
                        </h1>
                        <nav style={{display: 'flex'}}>
                            <NavButton page="home" label="Manajemen Buku" />
                            <NavButton page="stats" label="Statistik" />
                        </nav>
                    </div>
                </header>

                {/* Konten Utama */}
                <main style={{maxWidth: '800px', margin: '0 auto'}}>
                    {renderPage()}
                </main>

                {/* Footer */}
                <footer style={{marginTop: '50px', padding: '20px 0', textAlign: 'center', fontSize: '0.8em', color: '#888', borderTop: '1px solid #444'}}>
                    Tugas Praktikum Aplikasi Manajemen Buku Pribadi - Menggunakan React Hooks & Context API
                </footer>
            </div>
        </BookProvider>
    );
};

// Eksport komponen utama agar dapat dijalankan
export default App;