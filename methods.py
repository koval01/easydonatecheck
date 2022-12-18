class Methods:

    @staticmethod
    def truncate(f, n):
        s = '%.12f' % f
        i, p, d = s.partition('.')
        return '.'.join([i, (d + '0' * n)[:n]])
