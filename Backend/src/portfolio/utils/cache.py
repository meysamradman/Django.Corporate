"""
Cache key utilities for portfolio app
"""

class PortfolioCacheKeys:
    """Standardized cache keys for portfolio app"""
    
    @staticmethod
    def seo_data(portfolio_pk):
        """Cache key for portfolio SEO data"""
        return f"portfolio:seo_data:{portfolio_pk}"
    
    @staticmethod
    def main_image(portfolio_pk):
        """Cache key for portfolio main image"""
        return f"portfolio:main_image:{portfolio_pk}"
    
    @staticmethod
    def seo_report():
        """Cache key for portfolio SEO report"""
        return "portfolio:seo_report"
    
    @staticmethod
    def structured_data(portfolio_pk):
        """Cache key for portfolio structured data"""
        return f"portfolio:structured_data:{portfolio_pk}"