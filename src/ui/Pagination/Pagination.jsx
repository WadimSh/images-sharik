import { HiOutlineChevronLeft, HiOutlineChevronRight } from "react-icons/hi";
import { FiMoreHorizontal } from "react-icons/fi";
import './Pagination.css';

const Pagination = ({
  currentPage,
  totalCount,
  itemsPerPage,
  onPageChange,
  className = '',
  disabled = false
}) => {
  const totalPages = Math.ceil(totalCount / itemsPerPage);
  
  if (totalPages <= 1) return null;

  const getVisiblePages = () => {
    if (totalPages <= 1) {
      return [1];
    }

    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    if (currentPage <= 3) {
      return [1, 2, 3, 4, 'ellipsis', totalPages];
    }

    if (currentPage >= totalPages - 2) {
      return [1, 'ellipsis', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }

    return [
      1,
      'ellipsis',
      currentPage - 1,
      currentPage,
      currentPage + 1,
      'ellipsis',
      totalPages
    ];
  };

  const handlePageClick = (page) => {
    if (disabled) return;
    if (typeof page === 'number') {
      onPageChange(page);
    }
  };

  const visiblePages = getVisiblePages();

  return (
    <div className={`pagination ${className}`}>
      {totalPages > 1 && (
        <button
          onClick={() => handlePageClick(currentPage - 1)}
          disabled={disabled || currentPage === 1}
          className="pagination__arrow"
        >
          <HiOutlineChevronLeft size={16} />
        </button>
      )}

      {visiblePages.map((page, index) => {
        if (page === 'ellipsis') {
          return (
            <span key={`ellipsis-${index}`} className="pagination__ellipsis">
              <FiMoreHorizontal size={16} />
            </span>
          );
        }

        const pageNumber = page;
        const isActive = currentPage === pageNumber;
        
        return (
          <button
            key={pageNumber}
            onClick={() => handlePageClick(pageNumber)}
            disabled={disabled}
            className={`pagination__page ${
              isActive ? 'pagination__page--active' : ''
            }`}
          >
            {pageNumber}
          </button>
        );
      })}

      {totalPages > 1 && (
        <button
          onClick={() => handlePageClick(currentPage + 1)}
          disabled={disabled || currentPage === totalPages}
          className="pagination__arrow"
        >
          <HiOutlineChevronRight size={16} />
        </button>
      )}
    </div>
  );
};

export default Pagination;